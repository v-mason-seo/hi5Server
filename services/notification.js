const db = require('./mysqlservice')
const pushservice = require('./pushservice')

exports.addCommentNotification = function( contentid, userid){
    let sql =
    `
    insert into notification( notification_type_id, sender_id, receiver_id , target )
    select 1,?, target.user_id 
         , json_object('content_id', target.content_id
                     , 'ment'      , target.title ) as target
    from (
        select content_id, user_id, left(title, 15) title
          from contents 
         where content_id = ?
    ) target
    where target.user_id <> ?;
    ` 
    let parameter = [userid, contentid , userid]
    db.excuteSql(sql, parameter, (err, results, fields) => {
        if (err){ return }
        let notificationId = results.insertId
        pushservice.sendNotification(notificationId)
    })
  
}


exports.addReplyNotification = function( contentid, commentid, userid){
    let sql =
    `
    insert into notification( notification_type_id, sender_id, receiver_id , target )
    select 2,?, target.user_id 
         , json_object('content_id', target.content_id
                     , 'ment'      , target.title
                     , 'comment_id', ? ) as target
    from (
        select content_id, user_id, left(title, 15) title
          from contents 
         where content_id = ?
    ) target
    where target.user_id <> ?;
    ` 

    let parameter = [userid, commentid, contentid, userid]
    db.excuteSql(sql, parameter, (err, results, fields) => {
        if (err){ return }
        let notificationId = results.insertId
        pushservice.sendNotification(notificationId)
    })
}

//특정 유저를 언급했을때 
exports.addMentionNotification = function( contentid, commentid, userid){
    let sql =
    `
    
    ` 

    let parameter = [userid, commentid, contentid, userid]
    db.excuteSql(sql, parameter, (err, results, fields) => {
        if (err){ return }
    })
}

exports.addHifiveNotification = function( contentid, userid){
    let sql =
    `
    insert into notification( notification_type_id, sender_id, receiver_id , target )
    select 7,?, target.user_id 
         , json_object('content_id', target.content_id
                     , 'ment'      , target.title ) as target
    from (
        select content_id, user_id, left(title, 15) title
          from contents 
         where content_id = ?
    ) target
    where target.user_id <> ?;
    ` 

    let parameter = [userid, contentid, userid]
    db.excuteSql(sql, parameter, (err, results, fields) => {
        if (err){ return }
    }) 
}

exports.addScrapNotification = function( contentid, userid){
    let sql =
    `
    insert into notification( notification_type_id, sender_id, receiver_id , target )
    select 8,?, target.user_id 
         , json_object('content_id', target.content_id
                     , 'ment'      , target.title ) as target
    from (
        select content_id, user_id, left(title, 15) title
          from contents 
         where content_id = ?
    ) target
    where target.user_id <> ?;
    ` 

    let parameter = [userid, contentid, userid]
    db.excuteSql(sql, parameter, (err, results, fields) => {
        if (err){ return }
    })
}