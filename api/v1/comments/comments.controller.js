
const db = require('../../../services/mysqlservice');
const notification = require('../../../services/notification');
const userblock = require('../../../services/userblock')
//http://127.0.0.1:5200/board?board_type=1&limit=15&offset=0



exports.getComments = (req, res) => {
    
    let contentid = req.query.contentid;
    let userid = req.user?req.user.userid : undefined;

    let query = 
    `
    select a.comment_id
        ,a.content_id
        ,a.group_id
        ,a.depth
        ,a.parent_id
        ,IF(deleted,'삭제된 댓글입니다',a.content) content
        ,a.likers 
        ,a.deleted
        ,a.reported
        ,a.created
        ,a.updated
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
        ) as user
    , json_object( 'like' , if(c.user_id  ,1,0)
                ) as user_action    
    from comments a 
        left join comment_like_users c on a.comment_id = c.comment_id and c.user_id = ?
        , user_info b
    where
        a.user_id = b.user_id
        and a.content_id = ?;
    `;

    let parameter = [userid, contentid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result);
    } );    
};



exports.getBestComments = (req, res) => {
    
    let contentid = req.query.contentid;
    // let userid = req.query.userid;
    let userid = req.user?req.user.userid : undefined;

    let query = 
    `
    select a.comment_id
        ,a.content_id
        ,a.group_id
        ,a.depth
        ,a.parent_id
        ,IF(deleted,'삭제된 댓글입니다',a.content) content
        ,a.likers 
        ,a.deleted
        ,a.reported
        ,a.created
        ,a.updated
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
        ) as user
    , json_object( 'like' , if(c.user_id  ,1,0)
                ) as user_action            
        , json_object( 'like' , if(c.user_id  ,1,0)
                    ) as user_action                      
        from comments a 
             left join comment_like_users c on a.comment_id = c.comment_id and c.user_id = ?
             , user_info b
    where
        a.user_id = b.user_id
        and a.content_id = ?
        order by likers , created 
        limit 3        
        ;
    `;

    let parameter = [userid, contentid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result);
    } );    
};



exports.getGroupComments = (req, res) => {
    
    let id = req.params.id;
    // let userid = req.query.userid;
    let userid = req.user?req.user.userid : undefined;
    
    // if (!userid) userid = 0;

    let query = 
    `
    select a.comment_id
        ,a.content_id
        ,a.group_id
        ,a.depth
        ,a.parent_id
        ,IF(deleted,'삭제된 댓글입니다',a.content) content
        ,a.likers 
        ,a.deleted
        ,a.reported
        ,a.created
        ,a.updated
    ,json_object( 'avatar_url' , b.avatar_url
                , 'nickname'   ,  b.nickname
                , 'username'  ,  b.username
                ) as user
    , json_object( 'like' , if(c.user_id  ,1,0)
                ) as user_action                     
        from comments a 
                    left join comment_like_users c on a.comment_id = c.comment_id and c.user_id = ?
        , user_info b
    where
        a.user_id = b.user_id
        and (a.comment_id =? or a.group_id = ?)
    order by a.group_id desc;
    `;

    let parameter = [userid, id, id];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result);
    } );    
};

exports.getComment = (req, res) => {
    
    let id = req.params.id; //comment id
    // let userid = req.query.userid;
    let userid = req.user?req.user.userid : undefined;
    
    let query = 
    `
    select a.comment_id
        ,a.content_id
        ,a.group_id
        ,a.depth
        ,a.parent_id
        ,IF(deleted,'삭제된 댓글입니다',a.content) content
        ,a.likers 
        ,a.deleted
        ,a.reported
        ,a.created
        ,a.updated
        ,json_object( 'avatar_url' , b.avatar_url
        , 'nickname'   ,  b.nickname
        , 'username'  ,  b.username
        ) as user    
    , json_object( 'like' , if(c.user_id  ,1,0)
                ) as user_action                      
    from
        comments a 
                left join comment_like_users c on a.comment_id = c.comment_id and c.user_id = ?
    , user_info b
    where
        a.user_id = b.user_id
        and (a.comment_id = ? or a.group_id = ?);
    `;

    let parameter = [userid, id, id];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        
        // console.log('result - ' + result.insertid);
        return res.status(200).json(result[0]);
    } );    

};


exports.createComment = (req, res) => {
    let userid = req.user.userid;

    //todo
    // userblock.isBlockUser(userid)

    let contentid = req.body.contentid;
    let parentid = req.body.parentid ? req.body.parentid : 0; 
    let groupid = req.body.groupid ? req.body.groupid : 0;
    let depth = req.body.depth ? req.body.depth : 1;
    let content = req.body.content;
    let celltype = req.body.celltype;

    //user ip
    var ipAddress = (req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress).split(",")[0];

    // convert from "::ffff:192.0.0.1"  to "192.0.0.1"
    if (ipAddress.substr(0, 7) == "::ffff:") {
        ipAddress = ipAddress.substr(7)
    }

    let comment = {}
    comment.userid = userid
    comment.contentid = contentid
    comment.parentid = parentid
    comment.groupid = groupid
    comment.depth = depth
    comment.content = content
    comment.celltype = celltype
    comment.ip = ipAddress

    //------------------------------------------------------------------------------
    // 랜덤 유저 아이디 생성 ( 10 ~ 59 번 아이디 생성)
    //------------------------------------------------------------------------------
    if ( comment.userid == 274 || comment.userid == 8 || comment.userid == 124 ) {
        comment.userid = makeRandom(10, 59);
    }

    db.constModelTrasaction( 
        [
            commentCreate
            ,commentContentAddCommentCount
        ]
        , comment
        , (err,result) => {
            if (err) return res.status(500).json({result : 0, message :  err.message})

            if (depth == 1) {
                //todo
                // db.addCommentNotification(contentid, userid)
                notification.addCommentNotification(contentid, userid)
            }else { 
                notification.addReplyNotification(contentid, result.id, userid)
                // db.addReplyNotification(contentid, result.id, userid)
            }

            //find @tag from message
            // db.addMentionUserNotification(contentid, userid)
            
            res.status(201).json( {result : 1, message : "created", data : result})
        }
    )
};

function makeRandom(min, max){
    var RandVal = Math.random() * (max- min) + min;
    return Math.floor(RandVal);
}


/**
 * 댓글 삭제
 */
exports.deleteComment = (req,res) =>  {

    let id = req.params.id
    let userid = req.user.userid
    // let contentid = req.body.contentid

    comment = {}
    comment.id = id
    comment.userid = userid
    
    db.constModelTrasaction( 
        [
            commentContentMinusCommentCount
            ,commentDelete
            
        ]
        , comment
        , (err,result) => {
            if (err) return res.status(500).json({result : 0, message :  err.message})

            res.status(200).json( {result : 1, message :  "success"})
        }
    )
}


exports.updateComment = (req, res) => {
    let id = req.params.id;
    let content = req.body.content;
    let userid = req.user.userid;
    let query = 
    `
    update comments
       set content = ?
         , updated = now()
     where comment_id = ?
       and user_id = ?;
    `

    var parameter = [content, id, userid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(500).json({result : 0, message :  err.message})
        }
        //success
        const affectedRows = result["affectedRows"]

        if ( affectedRows > 0) {
            return res.status(200).json({result : 1, message : "updated"});
        }

        return res.status(404).json({result : 0, message :  "fail"});
    })    
};


exports.reported = (req,res) =>  {

    var id = req.params.id;

    var query = 
    `
    update comments
       set reported = 1
     where comment_id = ?;    
    `
    var parameter = [id];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        const affectedRows = result["affectedRows"]

        if ( affectedRows > 0) {
            return res.status(200).json({result : 1, message :  "success"})
        }
        return res.status(404).json({result : 0, message : 'delete failed'})
    })
};


exports.setHifive = (req,res) =>  {

    let commentid = req.params.id;
    let userid = req.user.userid;

    comment = {}

    comment.userid = userid
    comment.commentid = commentid

    db.constModelTrasaction( 
        [commentLikeUserAdd, commentLikeCountAdd]
        , comment
        , (err,result) => {
            if (err) return res.status(500).json({result : 0, message :  err.message})

            res.status(200).json( {result : 1, message :  "success"})
        }
    )
};



exports.setUnHifive = (req,res) =>  {
    
    let commentid = req.params.id;
    let userid = req.user.userid;

    comment = {}

    comment.userid = userid
    comment.commentid = commentid

    db.constModelTrasaction( 
        [
            commentLikeCountMinus
            ,commentLikeUserDelete
        ]
        , comment
        , (err,result) => {
            if (err) {
                // console.log(comment)
                //add to err log to server
                return res.status(500).json({result : 0, message :  err + err.message})
            }
            res.status(200).json( {result : 1, message :  "success"})
        }
    )
};



exports.getHifivedUsers = (req,res) =>  {

    var commentId = req.params.id;

    var query = 
    `
    select b.avatar_url
        ,  b.username
        ,  b.nickname    
     from comment_like_users a,    user_info b
    where a.user_id = b.user_id
      and a.comment_id = ?;
    `
    var parameter = [commentId];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(500).json({result : 0, message : 'server error : ' + err})
        }
        //success
            return res.status(200).json({result : 1, message :  "success"});
    })
};


//database functions 

function commentCreate ( connection, comment, callback ){
    //comment validate 

    let query = 
    `
    insert into comments( parent_id, depth, content_id, user_id, group_id, content, celltype, ip)
                 values ( ?,?,?,?,?,?, ?, ?);
    `

    const parameter = [comment.parentid,comment.depth,comment.contentid,comment.userid,comment.groupid,comment.content, comment.celltype, comment.ip];

    db.trasactionCreateSql(connection, query,parameter, comment, callback)    
}

function commentDelete ( connection, comment, callback ){
    let query = 
    `
    update comments
    set deleted = 1
  where comment_id = ?
    and user_id = ? ;    
    `    
    const parameter = [comment.id, comment.userid]

    db.trasactionUpdateSql(connection, query, parameter, comment, callback)
}

function commentContentAddCommentCount (connection, comment, callback ){
    

    let query = 
    `
    update contents a
       set a.comments = ifnull(a.comments,0) + 1
     where a.content_id = ?  ;
    `    
    const parameter = [comment.contentid];

    db.trasactionUpdateSql(connection, query, parameter, comment, callback)
}

function commentContentMinusCommentCount (connection, comment, callback ){

    let query = 
    `
    update contents a
    set a.comments = case when a.comments > 1 then a.comments - 1 else 0 end
  where a.content_id = (select content_id from comments where comment_id = ?) ;
    `    
    const parameter = [comment.commentid];

    db.trasactionUpdateSql(connection, query, parameter, comment, callback)
}

function commentLikeCountAdd (connection, comment, callback ){
    let query = 
    `
    update comments
    set likers = likers + 1
  where comment_id = ?;    
    `    
    const parameter = [comment.commentid];

    db.trasactionUpdateSql(connection, query, parameter, comment, callback)
}

function commentLikeCountMinus (connection, comment, callback ){
    let query = 
    `
    update comments
    set likers = case when likers > 1 then likers - 1 else 0 end
  where comment_id = ?;  
    `    
    const parameter = [comment.commentid];

    db.trasactionUpdateSql(connection, query, parameter, comment, callback)
}


function commentLikeUserAdd (connection, comment, callback ){
    let query = 
    `
    insert into comment_like_users(comment_id, user_id)
    values (? , ?)
    `    
    const parameter = [comment.commentid, comment.userid];

    db.trasactionCreateSql(connection, query, parameter, comment, callback)
}

function commentLikeUserDelete (connection, comment, callback ){
    let query = 
    `
    delete from comment_like_users
       where comment_id = ?
         and user_id = ?;
    `;    
    const parameter = [comment.commentid, comment.userid];

    db.trasactionDeleteSql(connection, query, parameter, comment, callback)
}
