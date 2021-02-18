
var db = require('../../../services/mysqlservice');


exports.getNotification = ( req, res) => {

    let confirm = (req.query.confirm ? req.query.confirm: 0 )
    let userid = (req.user?req.user.userid : undefined)
    let offset = req.query.offset
    let limit = req.query.limit 
    // let userid = req.query.userid

    if (!offset) {
        offset = 0
    }
    if (!limit) {
        limit = 15
    }

    if (confirm == 0) {
        offset = 0 
        limit = 30
    }

    let query = 
    `
    select max(a.notification_id) notification_id 
        ,a.notification_type_id 
        ,cast(concat('[',group_concat( distinct
                json_object( 'avatar_url', c.avatar_url
                            , 'nickname'   ,  c.nickname
                            ,'username' , c.username) 
                SEPARATOR ',')
                ,']') as json) as senders
        , confirm        
        , target
        , max(a.created) created
    from notification a
       , user_info c
    where a.sender_id = c.user_id 
      and a.receiver_id = ?
      and a.confirm = ?
    group by notification_type_id,  receiver_id, target
    order by created desc
    limit ?
    offset ? 
    ;
    `

    let parameter = [userid, confirm, limit, offset];

    db.excuteSql(query, parameter,(err,result) =>{
        if ( err ) return res.status(400).json({result : 0, message :  err.message})
        return res.status(200).json(result)
    } )    

};





exports.confirmNotification = (req,res) => {
    
    let notificationid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)
    
    let query =
    `
    update notification
        set confirm = 1 
    where notification_id = ?
        and receiver_id = ?
        and confirm = 0;
    `    
    let parameter = [notificationid, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(500).json({result : 0 ,message : "읽음 처리 실패" + err.message})
        }
        return res.status(200).json({result : 1 ,message : "읽음"});
    } )
};

exports.confirmNotification = (req,res) => {
    
    let notificationid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)
    
    let query =
    `
    update notification
        set confirm = 1 
    where notification_id = ?
        and receiver_id = ?
        and confirm = 0;
    `    
    let parameter = [notificationid, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(500).json({result : 0 ,message : "읽음 처리 실패" + err.message})
        }
        return res.status(200).json({result : 1 ,message : "읽음"});
    } )
};

/**
 * 내소식 읽음 처리 (임시버전)
 * @param {} req 
 * @param {*} res 
 */
exports.confirmGroupNotification = (req,res) => {
    
    let notitypeid = req.query.notitypeid;
    let contentid = req.query.contentid;
    let userid = (req.user?req.user.userid : undefined)
    
    let query =
    `
    update notification
       set confirm = 1 
     where receiver_id = ?
       and confirm = 0
       and notification_type_id = ?
       and json_extract(target, '$.content_id') = ?
    `    
    let parameter = [userid, notitypeid, contentid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(500).json({result : 0 ,message : "읽음 처리 실패" + err.message})
        }
        return res.status(200).json({result : 1 ,message : "읽음"});
    } )
};


/**
 * 내소식 읽음 처리 (임시버전)
 * @param {} req 
 * @param {*} res 
 */
exports.confirmAllNotification = (req,res) => {
    
    let notificationid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)
    
    let query =
    `
    update notification
       set confirm = 1 
     where receiver_id = ?
       and confirm =0
       and notification_id <= ?;
    `    
    let parameter = [userid, notificationid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(500).json({result : 0 ,message : "읽음 처리 실패" + err.message})
        }
        return res.status(200).json({result : 1 ,message : "읽음"});
    } )
};
