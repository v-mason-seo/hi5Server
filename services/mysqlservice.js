const mysql = require('mysql2')
const async = require('async')
const appconfig = require('../config/appconfig')
const cmd = require('../config/commands')
const telegramBot = require('./telegrambot')

var pool ;

function getPool() {
    if (pool) return pool;
    
    pool  = mysql.createPool({
        host     : appconfig.host,
        user     : appconfig.user,
        password : appconfig.password,
        database : appconfig.database ,
        port : appconfig.port,
        connectionLimit:40
    })
    
return pool;
}



//default sql excute
exports.excuteSql = function( sql, parameter,  callback){
    getPool().getConnection( function( err, connection){

        if (err){
            connection.release();
            return callback(err,null)
        }
        
        const q = connection.query( sql ,parameter ,  function( err, results, fields){
            connection.release();
            if (err){ 
                telegramBot.sqlerror(sql,parameter, err)
                return callback(err,null)}


            return callback(null, results);
        });

        //delete product mode

       
    });
};


//todo - add waterful async to simple 
exports.excuteTransactionSql = function( query1, parameter1, query2, parameter2,  callback){
    getPool().getConnection( function( err, connection){

        if (err ) { 
            telegramBot.sqlerror(query1,parameter1, err)
            connection.release();
            return callback(err,null)
        }

        connection.beginTransaction(function(err) {
            if (err) {
                connection.release();
                return callback(err,null)
            }
            
            
            connection.query(query1, parameter1, function (error, results, fields) {
                if (error) {
                    return connection.rollback(function() {
                        connection.release();
                        return callback(error,null);
                    });
                }
                //no data 
                if (results.affectedRows == 0){
                    return connection.rollback(function() {
                        connection.release();
                        return callback(null,results);
                    });                    
                };            

                connection.query(query2, parameter2, function (error, results, fields) {
                if (error) {
                    return connection.rollback(function() {
                        connection.release();
                        return callback(error,null);
                    });
                }

                    connection.commit(function(err) {
                        if (err) {
                        return connection.rollback(function() {
                            connection.release();
                            return callback(err,null);
                        });
                        }
                        // console.log('success!');
                        connection.release();
                        return  callback(null, results)
                    });
                });
            });
        });
    });
};


exports.excuteSocialUserGetID = function( user , callback){
    let query = `
            select user_id as userid, role
            from user_login 
            where ( provider = ? and provider_user_id = ?  )
               or ( email = ? and deleted = 0 );
            `;
    const parameter = [user.provider, user.providerUserID, user.email];

    this.excuteSql(query, parameter, (err, result)=> {
        //connection.release();        
        if (err) { return callback(err,null) }
        
        if ( result.length === 0) {
            return callback (null, { result : 0, command : cmd.notExistMember  ,user : user});
        }
        return  callback (null, { result : 1, data : result[0] });;
    });       
}


exports.excuteSocialUserSingUp = function( user,  mainCallback){


    getPool().getConnection( function( err, connection){

        if (err ) {
            connection.release();
            return mainCallback(err,null)
        }

        connection.beginTransaction(function(err) {
            if (err) {
                connection.release();
                return mainCallback(err,null)
            }

            async.waterfall([
                function( callback) {
                    // insert to user_login
                    let query1 = "insert into user_login(pw, email, provider, provider_user_id, is_verified) values( ? ,? ,? ,? ,1);"
                    let parameter1 = [user.pw, user.email, user.provider, user.providerUserID];
                            
                    connection.query(query1, parameter1, function (error, results, fields) {
                        if (error) {
                            return connection.rollback(function() {
                                connection.release();
                                return callback(error,null);
                            });
                        }
                        user.id = results.insertId;
                        return callback(null ,user);
                    });
                },
                function( user , callback) {
                    // insert to user_info

                    let query2 =  ` insert into user_info (user_id, username, nickname, profile, avatar_url) values (?,?,?,?,?); `;
                    let parameter2 = [ user.id, user.username, user.nickname, user.profile, user.avatarURL];

                    connection.query(query2, parameter2, function (error, results, fields) {
                        if (error) {
                            return connection.rollback(function() {
                                connection.release();
                                return callback(error,null);
                            });
                        }
                        return callback(null, {result : 1 , data : user.id , message : "Create User"})                        
                    });
                },
            ], function (err, result) {
                if (err){
                    return connection.rollback(function() {
                        connection.release();
                        return mainCallback(err,null);
                    });
                }
                // result now equals 'done'
                connection.commit(function(err) {
                    if (err) {
                    return connection.rollback(function() {
                        connection.release();
                        return mainCallback(err,null);
                    });
                    }
                    // console.log('success!');
                    connection.release();
                    return mainCallback(null, result)
                });                
            });
        });
    });
};



exports.postContent = function( content ,  mainCallback){
    
    getPool().getConnection( function( err, connection){
        if (err ) { 
            connection.release()
            return callback(err,null)
        }
        
        connection.beginTransaction(function(err) {
            
            if (err) { 
                connection.release()
                return callback(err,null) 
            }
            //check auth
            async.waterfall([
                function( callback ){
                    let authCheckQuery = 
                    `
                    select count(*) user_auth
                         , (select auth from boards where board_id = ?) board_auth
                      from user_info
                     where  auth is not null
                       and user_id = ?
                       #and (JSON_CONTAINS(auth, ?) = true or JSON_CONTAINS(auth, '"*"') = true);
                    `;

                    let parameter = [content.boardid, content.userid, content.boardid]

                    
                    connection.query(authCheckQuery,parameter, function (err, results, fields) {
                        
                        if (err)  return callback(err,null) ;
                        if (results.length == 0 ) callback('권한이 없습니다',null) ;
                        if (results[0].board_auth === undefined) return callback('게시판이 문제가 있습니다',null) ;

                        if (results[0].board_auth == 0) return callback(null , content);

                        if (results[0].user_auth == 0 ) return callback('권한이 없습니다', null)
                        
                        return callback(null , content);
                    });
                },
                function( content, callback ) {
        
                    let contentSql =
                    `
                    insert into contents
                    (title, preview, content , user_id, board_id, tags, imgs, allow_comment, ip, bodytype ,celltype, link, arena_id, team_id, player_id,comp_id)
                    values( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `

                    //------------------------------------------------------------------------------
                    // 랜덤 유저 아이디 생성 ( 10 ~ 59 번 아이디 생성)
                    //------------------------------------------------------------------------------
                    if ( content.userid == 274 || content.userid == 8 || content.userid == 124 ) {
                        content.userid = makeRandom(10, 59);
                    }
        
                    let contentParameter = [content.title,
                                            content.preview,
                                            content.content ,
                                            content.userid,
                                            content.boardid,
                                            content.tags,
                                            content.imgs,
                                            content.allowComment,
                                            content.ip,
                                            content.bodytype,
                                            content.celltype,
                                            content.link,
                                            content.arenaid,
                                            content.teamid,
                                            content.playerid,
                                            content.compid
                                            ];
                    
                    connection.query(contentSql, contentParameter, function (err, results, fields) {
                        
                        if (err ) return callback(err,null) 
                        
                        content.contentid = results.insertId;
                        return callback(null , content);
                    });
                },
                function( content, callback){
                    
                    if ( content.tags == undefined || content.tags.length == 0) {
                        return callback(null , null, content)
                    }
                    
                    let tagObj = JSON.parse(content.tags);

                    if ( tagObj.length == 0) {
                        return callback(null , null, content)
                    }


                    let tagParamter = []
                    tagObj.map ( function(tag, i){
                        return tagParamter.push([tag])
                    })

                    const tagSql =
                    `
                    insert ignore tags ( name )
                    values ?
                    on duplicate key update mention_count = ifnull(mention_count,0) + 1
                    `        
                    connection.query(tagSql, [tagParamter], function (err, results, fields) {
                        
                        if (err)  return callback(err,null) ;
                        
                        return callback(null , tagParamter, content)
                    });
                },        
                function(  tagParamter, content, callback){
        
                    if ( tagParamter == undefined || content.contentid == undefined) {
                        return callback(null ,content)
                    }
                    
                    const tagmapSql =
                    `
                    insert ignore tagmap ( content_id, tag_id )
                    select ?, id
                      from tags
                     where name in ( ? )
                    `
                    connection.query(tagmapSql, [content.contentid, tagParamter], function (err, results, fields) {
                        if ( err ) return callback(err,null)         
                        return callback(null , content)
                    });
                },
                function( content, callback){
                    connection.commit(function(err) {
                        if (err) return callback(err,null)              
                        return callback(null, content)
                    })
                }
            ], function (err,  result ) {
                if (err) {
                    return connection.rollback(function() {
                        connection.release();
                        return mainCallback(err,null)
                    })
                }
                connection.release();
                return mainCallback(null, result)
            });
        })
    })    
}

function makeRandom(min, max){
    var RandVal = Math.random() * (max- min) + min;
    return Math.floor(RandVal);
}

exports.postIssue = function( issue ,  mainCallback){
    
    getPool().getConnection( function( err, connection){
        if (err ) { 
            connection.release()
            return mainCallback(err,null)
        }
        
        connection.beginTransaction(function(err) {
            
            if (err) { 
                connection.release()
                return mainCallback(err,null)
            }
        
            async.waterfall([
                function( callback ) {
        
                    let contentSql =
                    `
                    insert into contents
                    (title, content , user_id, board_id, tags, imgs, allow_comment, ip, bodytype )
                    values( ?, ?, ?, ?, ?, ?, ?, ?, ? )  
                    `
        
                    let contentParameter = [issue.title,
                                            issue.content,
                                            issue.userid,
                                            issue.boardid,
                                            issue.tags,
                                            issue.imgs,
                                            issue.allowComment,
                                            issue.ip,
                                            issue.bodytype];
                    
                    connection.query(contentSql, contentParameter, function (err, results, fields) {
                        
                        if (err ) return callback(err,null) 
                        
                        issue.contentid = results.insertId;
                        return callback(null , issue);
                    });
                },
                function( issue, callback){
                    
                    if ( issue.tags == undefined || issue.tags.length == 0) {
                        return callback(null , null, issue)
                    }
                    
                    let tagObj = JSON.parse(issue.tags);

                    if ( tagObj.length == 0) {
                        return callback(null , null, issue)
                    }

                    let tagParamter = []
                    tagObj.map ( function(tag, i){
                        return tagParamter.push([tag])
                    })

                    const tagSql =
                    `
                    insert ignore tags ( name )
                    values ?
                    `        
                    connection.query(tagSql, [tagParamter], function (err, results, fields) {
                        
                        if (err)  return callback(err, null) ;
                        
                        return callback(null , tagParamter, issue)
                    });
                },        
                function(  tagParamter, issue, callback){
        
                    if ( tagParamter == undefined || issue.contentid == undefined) {
                        return callback(null ,issue)
                    }
                    
                    const tagmapSql =
                    `
                    insert ignore tagmap ( content_id, tag_id )
                    select ?, id
                      from tags
                     where name in ( ? )
                    `
                    connection.query(tagmapSql, [issue.contentid, tagParamter], function (err, results, fields) {
                        if ( err ) 
                            return callback(err, null)

                        return callback(null , issue)
                    });
                },
                function( issue, callback){
                    
                    let query =
                                `
                                insert into issues( content_id, tags, platform  ) 
                                values( ?, ?, ? )  
                                `
                    let parameter = [issue.contentid, issue.tags, issue.platform];
                                            
                    connection.query(query, parameter, function (err, results, fields) {
                        
                        if (err )
                            return callback(err,null) 

                        issue.id = results.insertId;
                        return callback(null ,issue)
                    });
                },                
                function( result, callback){
                    connection.commit(function(err) {
                        if (err) return callback(err,null)              
                        return callback(null, result)
                    })
                }
            ], function (err,  result ) {
                if (err) {
                    return connection.rollback(function() {
                        connection.release();
                        return mainCallback(err,null)
                    })
                }
                connection.release();
                return mainCallback(null, result)
            })
        })
    })    
        
}

//create Content from MatchTalk
exports.matchTalkToContent = function( matchTalk ,  mainCallback){
    
    getPool().getConnection( function( err, connection){
        if (err ) { 
            connection.release()
            return callback(err,null) 
        }
        
        connection.beginTransaction(function(err) {
            
            if (err) { 
                connection.release()
                return callback(err,null) 
            }
        
            async.waterfall([
                function( callback ) {
                    const checkHifiveSql =
                    `
                    select hifive 
                      from match_talks 
                     where talk_id = ? 
                       and content_id is null
                    `        
                    connection.query(checkHifiveSql, [matchTalk.talkid], function (err, results, fields) {
                        
                        if (err)  return callback(err,null) ;
                        if (results.length == 0 ) return mainCallback(null, true) 
                        if (results[0].hifive  < 1) {
                            return mainCallback(null, true)
                        }
                        return callback(null , matchTalk)
                    });

                },
                function( matchTalk, callback){

                    let contentSql =
                    `
                    insert into contents
                    (title,  content , user_id, board_id, bodytype , celltype, arena_id)
                    select content,content,user_id,200,1,1, match_id
                    from match_talks
                    where talk_id = ?  ;
                                        
                    `
                    //제목 컨텐츠 분리
                    
                    connection.query(contentSql, [matchTalk.talkid], function (err, results, fields) {
                        
                        if (err ) return callback(err,null) 
                        
                        let contentid = results.insertId;
                        return callback(null , matchTalk, contentid);
                    });

                },        
                function(  matchTalk, contentid, callback){

                    
                    const updateMatchTalk =
                    `
                    update match_talks
                      set content_id = ?
                    where talk_id = ?
                    `

                    
                    connection.query(updateMatchTalk, [contentid, matchTalk.talkid], function (err, results, fields) {
                        if ( err ) return callback(err,null)         
                        return callback(null , matchTalk)
                    });
                },
                function( result, callback){
                    connection.commit(function(err) {
                        if (err) return callback(err,null)              
                        return callback(null, result)
                    })
                }
            ], function (err,  result ) {
                if (err) {
                    return connection.rollback(function() {
                        connection.release();
                        return mainCallback(err,null)
                    })
                }
                connection.release();
                return mainCallback(null, result)
            });
        })
    })    
}

function transactionSelectSql(connection, sql, parameter, constModel , callback){
        var q = connection.query( sql ,parameter ,  function( err, results, fields){
            connection.release();
            if (err){ return callback(err, connection, null) }
            return callback(null,connection, constModel)
            // test2(cb)
        });  
}


exports.trasactionCreateSql = function(connection,sql, parameter , constModel , callback){
    
        //console.log('** exports.excuteSql - 1');
        var q = connection.query( sql ,parameter ,  function( err, results, fields){
            connection.release();
            if (err){ return callback(err, connection, null)}

            if (results.affectedRows == 0) { return callback("Insert fail",null)}

            constModel.id = results.insertId
            return callback(null, connection, constModel)
            // test2(cb)
        });
}

exports.trasactionUpdateSql = function(connection, sql, parameter , constModel, callback){
        var q = connection.query( sql ,parameter ,  function( err, results, fields){
            connection.release();
            if (err){ return callback(err, connection, null)}

            // if (results.affectedRows == 0) { return callback("Update fail",null)}
            return callback(null, connection, constModel)
            // test2(cb)
    });  
}

exports.trasactionDeleteSql = function(connection, sql, parameter , constModel, callback){
    
        var q = connection.query( sql ,parameter ,  function( err, results, fields){
            connection.release();
            if (err){ return callback(err, connection, null)}

            if (results.affectedRows == 0) { return callback("Delete fail",null)}
            return callback(null, connection, constModel)
            // test2(cb)
        });
}
    
//////////////////////////////////////////////



exports.crudTrasaction = function(funcList  ,mainCallback){
    getPool().getConnection( function( err, connection){
        
        if (err ) { 
            connection.release()
            telegramBot.sendSqlErrorMessage(err)
            return mainCallback(err,null); 
        }

        connection.beginTransaction(function(err) {
            if (err) {
                connection.release()
                telegramBot.sendSqlErrorMessage(err)
                return mainCallback(err,null) 
            }


            async.series(funcList
                , function (err, result) {
                    if (err){
                        telegramBot.sendSqlErrorMessage(err)
                        return connection.rollback(function() {
                            connection.release();
                            return mainCallback(err,null);
                        });
                    }
                    connection.commit(function(err) {
                        if (err) {
                            telegramBot.sendSqlErrorMessage(err)
                            return connection.rollback(function() {
                                connection.release();
                                return mainCallback(err,null);
                            });
                        }
                        connection.release();
                        return mainCallback(null, result)
                    });                
                 }
            );
        });
    });
}


exports.constModelTrasaction = function(funcList ,parameter ,mainCallback){
    getPool().getConnection( function( err, connection){
        
        if (err ) { 
            connection.release();
            return mainCallback(err,null); 
        }

        connection.beginTransaction(function(err) {
            if (err) { return mainCallback(err,null) }

            
            funcList.unshift(async.constant(connection,parameter))

            async.waterfall(funcList
                , function (err, connection, result) {
                    if (err){
                        return connection.rollback(function() {
                            connection.release();
                            return mainCallback(err,null);
                        });
                    }
                    // result now equals 'done'
                    connection.commit(function(err) {
                        if (err) {
                            return connection.rollback(function() {
                                connection.release();
                                return mainCallback(err,null);
                            });
                        }
                        // console.log('success!');
                        connection.release();
                        return mainCallback(null, result)
                    });                
                 }
            );
        });
    });
}



