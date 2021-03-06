
var db = require('../../../services/mysqlservice');


exports.getIssue = ( req, res) => {

    let issueid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)
    
    let offset = req.query.offset;
    let limit = req.query.limit ;


    if (!offset) { offset = 0 }

    if (!limit) {  limit = 15 }
    let query = 
    `
    select
            f.issue_id
            ,f.closed
            ,f.activity
            ,f.progress
            ,cast(f.tags as json) tags
            ,f.platform
            ,json_object(
                        'content_id',a.content_id
                        ,'board_id',a.board_id
                        ,'title',a.title
                        ,'content',a.content
                        ,'comments',a.comments
                        ,'likers',a.likers
                        ,'scraps',a.scraps
                        ,'tags',a.tags
                        ,'imgs',a.imgs
                        ,'ip',a.ip
                        ,'deleted',a.deleted
                        ,'reported',a.reported
                        ,'created', DATE_FORMAT(a.created     ,'%Y-%m-%dT%T.000Z')     
                        ,'updated', DATE_FORMAT(a.updated     ,'%Y-%m-%dT%T.000Z') 
                        ,'allow_comment',a.allow_comment
                        ,'bodytype',a.bodytype
                ) contents
           , json_object( 'avatar_url',c.avatar_url
                    , 'nickname'   ,  c.nickname
                    ,'username' , c.username
                ) user
            , json_object( 'like' , if(d.count  ,d.count,0)
                          , 'scrap', if(e.user_id  ,1,0)
                          ,'hasImgs' , ifnull(json_length(a.imgs),0)
                    ) as user_action  
    from
        contents a
        left join content_like_users d on a.content_id = d.content_id
        and d.user_id = ?
        left join content_scrap_users e on a.content_id = e.content_id
        and e.user_id = ?,
        user_info c,
        issues f
    where
        a.user_id = c.user_id
        and a.content_id = f.content_id
        and ifnull(a.deleted, 0) != 1
        and f.issue_id = ?
        limit ?
        offset ? 
    ;
    `

    let parameter = [userid, userid, issueid, limit, offset];

    db.excuteSql(query, parameter,(err,result) =>{
        if ( err ) return res.status(400).json({result : 0, message :  err.message})
        return res.status(200).json(result[0])
    } )    

};



exports.postIssue = (req,res) => {

    let userid = req.user.userid;
    
    let boardid    = req.body.boardid;
    let title      = req.body.title;
    let content    = req.body.content;
    let ip         = req.body.ip;
    let tags       = req.body.tags;
    let imgs       = req.body.imgs;
    let bodytype   = req.body.bodytype;
    let platform   = req.body.platform; //1 : android , 2 : ios, 3 s: web

    let allowComment = 1; 

    var issue = {}

    issue.boardid = boardid;
    issue.title = title;
    issue.content = content;
    issue.userid = userid;
    issue.ip = ip;
    issue.tags = tags;
    issue.imgs = imgs;
    issue.bodytype = bodytype;
    issue.allowComment = allowComment;
    issue.platform = platform;

    db.postIssue( issue ,(err,result) =>{
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(201).json({result : 1, cmd : "update"});
    })   
};



exports.updateIssue = (req,res) => {
    
    let userid = req.user.userid;
    
    let contentid  = req.params.id;
    let title      = req.body.title;
    let content    = req.body.content;
    let boardid    = req.body.boardid;
    let tags       = req.body.tags;
    let imgs       = req.body.imgs;
    let allowComment = req.body.allowcomment; 
    let bodytype   = req.body.bodytype;
    
        let query =
        `
        update contents a
        set    a.title = ?
            ,  a.preview = ?
            ,  a.content = ?
            ,  a.board_id = ?
            ,  a.tags = ?
            ,  a.imgs = ?
            ,  a.allow_comment = ?
            ,  a.bodytype = ?
            ,  a.updated = now()
         where a.content_id = ?
         and   a.user_id = ?
         and   a.deleted = 0;
        `
    
        let parameter = [title, preview, content, boardid, tags, imgs, allowComment, bodytype, contentid, userid];

        
        db.excuteSql(query, parameter,(err,result) =>{
            
            if ( err ) {
                return res.status(400).json({result : 0, message :  err.message})
            }
    
            return res.status(200).json(result);
        } )
    };
// exports.deleteContent = (req, res) => {

// };

exports.closeIssue = (req, res) => {

    let issueid = req.params.id;
    let userid     = req.user.userid;
    
    if (!issueid) { return res.status(400).json({result : 0, message :  "Issue Id is null"}) }
    

    let query =
    `
    update issues
    set closed = now()
        ,close_user_id = ?
     where issue_id = ?;
    `

    let parameter = [userid, issueid ];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json({result : 1, message :  "success"});
    } )
};



exports.appendActivity = (req, res) => {
    
    let issue_id = req.params.issueid;
    let userid     = req.user.userid;

    let query =
    `
    update issues
        set activity =  JSON_ARRAY_INSERT(activity, '$[1]', 'x22');
        where issue_id = ?;
    `

    let parameter = [issue_id, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json(result);
    } )
};
