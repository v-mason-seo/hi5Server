
const db = require('../../../services/mysqlservice');
const caster = require('../../../services/caster')

//http://127.0.0.1:5200/board?board_type=1&limit=15&offset=0 



exports.getTalks = (req, res) => {
    
    let matchid = req.query.matchid;
    let userid = req.user?req.user.userid : undefined;
    let filterUsername  = req.query.username;
    let type = req.query.type;
    let limit = req.query.limit? req.query.limit : 15;
    let offset = req.query.offset ? req.query.offset: 0;
    
    let query = 
    `
    select a.talk_id
        ,a.status        
        ,IF(deleted,'삭제된 대화입니다',a.content) content
        ,a.media_url
        ,a.content_id        
        ,a.hifive 
        ,a.created
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
                    ) as user
        , json_object( 'like' , if(c.user_id  ,1,0)
                    ) as user_action       
    from match_talks a 
        left join match_talk_hifived_users c on a.talk_id = c.talk_id and c.user_id = ?
        , user_info b
    where a.user_id = b.user_id
      and a.match_id = ?
      and a.celltype = ifnull(?,a.celltype)
      and b.username = ifnull(?, b.username)
     limit ?
     offset ?
    `;

    let parameter = [userid, matchid,type, filterUsername, limit , offset ];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result);
    } );    
};



exports.getMatchScreenTalks = (req, res) => {
    
    let matchid = req.query.matchid;
    let type = req.query.type;
    let limit = req.query.limit? req.query.limit : 15;
    let offset = req.query.offset ? req.query.offset: 0;    

    let query = 
    `
    select a.talk_id
        ,a.status        
        ,IF(deleted,'삭제된 대화입니다',a.content) content
        ,a.media_url
        ,a.hifive 
        ,a.content_id
        ,a.created
        ,a.celltype
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
                    ) as user
    from match_talks a 
        , user_info b
    where a.user_id = b.user_id
      and a.match_id = ?
      and a.celltype = ?
      order by a.created desc
        limit ?
        offset ?
    `;

    let parameter = [ matchid, type, limit, offset];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result);
    } );    
};

exports.getTalk = (req, res) => {
    
    let id = req.params.id; 
    let userid = req.user?req.user.userid : undefined;
    
    let query = 
    `
    select a.talk_id
        ,a.content_id
        ,a.status
        ,IF(deleted,'삭제된 댓글입니다',a.content) content
        ,a.media_url
        ,a.hifive 
        ,a.deleted
        ,a.reported
        ,a.created
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
        ) as user    
    , json_object( 'like' , if(c.user_id  ,1,0)
                ) as user_action                      
    from
         match_talks a 
                left join match_talk_hifived_users c on a.talk_id = c.talk_id and c.user_id = ?
    , user_info b
    where
        a.user_id = b.user_id
        and a.match_id = ?
    `;

    let parameter = [userid, id];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result[0]);
    } );    

};

exports.createTalk = (req, res) => {
    let userid = req.user.userid

    let matchid = req.body.matchid
    let content = req.body.content
    let mediaUrl = req.body.media_url
    let celltype = req.body.celltype ? req.body.celltype : 0
    let status = req.body.status 
    //user ip
    var ipAddress = (req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress).split(",")[0];

    // convert from "::ffff:192.0.0.1"  to "192.0.0.1"
    if (ipAddress.substr(0, 7) == "::ffff:") {
        ipAddress = ipAddress.substr(7)
    }    

    let talk = {}
    talk.userid = userid
    talk.matchid = matchid
    talk.content = content
    talk.celltype = celltype
    talk.mediaUrl = mediaUrl
    talk.ip = ipAddress
    talk.status = status

    db.constModelTrasaction( 
        [
            talkCreate
        ]
        , talk
        , (err,result) => {
            if (err) return res.status(500).json({result : 0, message :  err.message})
            
            res.status(201).json( {result : 1, message : "created", data : result})
        }
    )
};


/**
 * 댓글 삭제
 */
exports.deleteTalk = (req,res) =>  {

    let talkid = req.params.id
    let userid = req.user.userid
    // let matchid = req.body.matchid

    talk = {}
    talk.talkid = talkid
    talk.userid = userid
    
    db.constModelTrasaction( 
        [
            // commentContentMinusCommentCount
            talkDelete
            
        ]
        , talk
        , (err,result) => {
            if (err) return res.status(500).json({result : 0, message :  err.message})

            res.status(200).json( {result : 1, message :  "delete sucess"})
        }
    )
}


exports.reported = (req,res) =>  {

    var talkid = req.params.id;

    var query = 
    `
    update match_talks
       set reported = 1
     where talk_id = ?;    
    `
    var parameter = [talkid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        const affectedRows = result["affectedRows"]

        if ( affectedRows > 0) {
            return res.status(200).json({result : 1, message :  "신고 완료"})
        }
        return res.status(404).json({result : 0, message : '신고 실패'})
    })
};


exports.setHifive = (req,res) =>  {

    let talkid = req.params.id;
    let userid = req.user.userid;

    talk = {}

    talk.userid = userid
    talk.talkid = talkid

    db.constModelTrasaction( 
        [ talkHifiveCountAdd ]
        // [talkHifiveUserAdd , talkHifiveCountAdd ]
        , talk
        , (err,result) => {
            if (err) {
                if (err.code == 'ER_DUP_ENTRY'){
                    return res.status(404).json({result : 0, message :  '이미 추천하셨습니다'})
                }
                return res.status(500).json({result : 0, message :  err.message})
            }

            res.status(200).json( {result : 1, message :  "success"})
        }
    )
};



// exports.setUnHifive = (req,res) =>  {
    
//     let talkid = req.params.id;
//     let userid = req.user.userid;

//     talk = {}

//     talk.userid = userid
//     talk.talkid = talkid

//     db.constModelTrasaction( 
//         [
//             talkHifiveCountMinus
//             ,talkHifiveUserDelete
//         ]
//         , talk
//         , (err,result) => {
//             if (err) {
//                 // console.log(comment)
//                 //add to err log to server
//                 return res.status(500).json({result : 0, message :  err + err.message})
//             }
//             res.status(200).json( {result : 1, message :  "success"})
//         }
//     )
// };



// exports.getHifivedUsers = (req,res) =>  {

//     var talkid = req.params.id;

//     var query = 
//     `
//     select b.avatar_url
//         ,  b.username 
//         ,  b.nickname
//      from match_talk_hifived_users a
//          , user_info b
//     where a.user_id = b.user_id
//       and a.talk_id = ?;
//     `;

//     var parameter = [talkid];

//     db.excuteSql(query, parameter, (err, result)=>{
//         if (err) {
//             return res.status(500).json({result : 0, message : 'server error : ' + err})
//         }
//         //success
//             return res.status(200).json(result);
//     });
// };


//database functions 

function talkCreate ( connection, talk, callback ){

    let query = 
    `insert into match_talks( match_id, user_id, content, media_url, status, celltype, ip)
    values ( ?, ?, ?, ? , ?, ?, ?);
    `

    const parameter = [talk.matchid, talk.userid , talk.content,  talk.mediaUrl ,talk.status, talk.celltype,  talk.ip];

    db.trasactionCreateSql(connection, query, parameter, talk, callback)    
}

function talkDelete ( connection,talk, callback ){
    let query = 
    `
    update match_talks
       set deleted = 1
     where talk_id = ?
       and user_id = ? ;    
    `    
    const parameter = [talk.talkid, talk.userid]

    db.trasactionUpdateSql(connection, query, parameter, talk, callback)
}


function checkHifiveTalk(talk , callback ){
    let q1 = 'select hifive from match_talks where talk_id = ? and content_id is null'
    var parameter = [talk.talkid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success

        if (result[0].hifive > 3) {

        }
    })
}


function talkHifiveCountAdd ( connection, talk, callback ){

    db.matchTalkToContent(talk, function(err,result){
        if (err){
            console.log(err)
        }
        //send mqtt => new content
        caster.castNewMatchTalk(talk)

        if (result){
            let query = 
            `
            update match_talks
               set hifive = ifnull(hifive,0) + 1
             where talk_id = ?;    
            `    
            const parameter = [talk.talkid];
        
            db.trasactionUpdateSql(connection, query, parameter, talk, callback)
        }
    })


}

function talkHifiveCountMinus ( connection, talk, callback ){
    let query = 
    `
    update match_talks
       set hifive = case when hifive > 1 then hifive - 1 else 0 end
     where talk_id = ?;  
    `    
    const parameter = [talk.talkid];

    db.trasactionUpdateSql(connection, query, parameter, talk, callback)
}


function talkHifiveUserAdd ( connection, talk, callback ){
    let query = 
    `
    insert into match_talk_hifived_users(talk_id, user_id)
    values (? , ?)
    `    
    const parameter = [talk.talkid, talk.userid];

    db.trasactionCreateSql(connection, query, parameter, talk, callback)
}

function talkHifiveUserDelete ( connection, talk, callback ){
    let query = 
    `
    delete from match_talk_hifived_users
       where talk_id = ?
         and user_id = ?;
    `;    
    const parameter = [talk.talkid, talk.userid];

    db.trasactionDeleteSql(connection, query, parameter, talk, callback)
}
