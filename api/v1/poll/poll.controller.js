
var db = require('../../../services/mysqlservice');
var async = require('async')




exports.getPoll = ( req, res) => {

    let pollid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)
    

    let query = 
    `
    select
            f.poll_id
            ,f.closed
            ,f.poll_items 
            ,f.is_secret_poll
            ,f.show_present_vote
            ,f.allow_multi_vote
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
                        ,'created', a.created
                        ,'updated', a.updated
                        ,'allow_comment',a.allow_comment
                        ,'bodytype',a.bodytype
                        ,'celltype',a.celltype
                ) contents
        , json_object( 'avatar_url',c.avatar_url
                       ,'nickname'   ,  c.nickname
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
        poll f
        where
        a.user_id = c.user_id
        and f.content_id = a.content_id
        and ifnull(a.deleted, 0) != 1
        and f.poll_id = ?;
    ;
    `

    let parameter = [userid, userid, pollid]

    let query2 = 
    `
    select pick, 
            cast(concat('[',group_concat(
                    json_object( 'avatar_url', a.avatar_url
                                , 'nickname'   ,  a.nickname
                                ,'username' , a.username) 
                    SEPARATOR ',')
                    ,']') as json) as user_pick
    from user_info a
    , poll_user_pick b
    where a.user_id = b.user_id
    and b.poll_id = ?
    group by pick ;
    `

    let parameter2 = [pollid]

    db.excuteSql(query, parameter,(err,result) =>{
        if ( err ) return res.status(400).json({result : 0, message :  err.message})
        // return res.status(200).json(result[0])

        db.excuteSql(query2, parameter2,(err,userPicks) =>{
            if ( err ) return res.status(400).json({result : 0, message :  err.message})
            
            var pollModel = result[0]
            pollModel.user_pick = userPicks
            // pollModel.poll_items
            
            return res.status(200).json( pollModel )
        })
    } )    
    

    //2step get users join to 1step object
};



exports.postPoll = (req,res) => {

    let userid = req.user.userid;
    
    let boardid    = req.body.boardid;
    let title      = req.body.title;
    let content    = req.body.content;
    let ip         = req.body.ip;
    let tags       = req.body.tags;
    let imgs       = req.body.imgs;
    let bodytype   = req.body.bodytype;
    let celltype   = 0;
    let platform   = req.body.platform; //1 : android , 2 : ios, 3 s: web

    let allowComment = 1; 

    var issue = {}

    // issue.boardid = boardid;
    // issue.title = title;
    // issue.content = content;
    // issue.userid = userid;
    // issue.ip = ip;
    // issue.tags = tags;
    // issue.imgs = imgs;
    // issue.bodytype = bodytype;
    // issue.allowComment = allowComment;
    // issue.platform = platform;

    db.postIssue( issue ,(err,result) =>{
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(201).json({result : 1, cmd : "update"});
    })   
};




exports.closePoll = (req, res) => {

    let pollid = req.params.id;
    let userid = req.user.userid;
    
    let query =
    `

    update poll
       set closed = now()
     where poll_id = ?;
    `

    let parameter = [ userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json(result);
    } )
};



exports.userPick = (req, res) => {
    
    let pollid = req.params.id
    let pick = req.body.pick // int
    let userid = req.user.userid

    //if closed < now  => return 

    let query =
    `
    update poll_user_choose
       set choose = ?
     where poll_id = ?
       and user_id = ?
       and close > now();
    `

    let parameter = [pick, pollid, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json(result);
    } )
};



// select json_extract( poll_items, CONCAT('$[' , choose , ']'))
// from poll a
//     ,poll_user_choose b
// where a.poll_id = b.poll_id;


// {"kaka": ["5","6"], "messi": ["100","200"]}

// #insert user id
// update poll
//  set poll_doc =  JSON_ARRAY_APPEND(poll_doc , '$.messi', '4')
// where id = 1 ;

// #remove user id
// update poll
//  set poll_doc =  JSON_REMOVE(poll_doc,  json_unquote(JSON_SEARCH(poll_doc, 'all', '7',null,'$.messi[*]')))
// where id = 1 ;


