
var db = require('../../../services/mysqlservice');


exports.getBests = (req,res) => {
    
    let bestid = req.query.bestid;
    let bestType = req.query.type;
    let bestRoll = req.query.roll;
    let userid = (req.user?req.user.userid : undefined)


    //2. Input data valid check 
    if (!bestType) { bestType = 'D' }

    if (!bestRoll) { bestRoll = 'C' }

    //3. excute query
    var query = 

    `
    select d.best_id
        , d.best_roll
        , a.content_id
        , a.title
        , a.arena_id
        , a.deleted
        , a.reported
        , a.comments
        , a.scraps
        , a.board_id
        , a.preview
        , a.likers
        , a.tags
        , a.bodytype  
        , a.celltype  
        , a.link
        , a.created
        , a.updated
        , ifnull(json_length(a.imgs),0) hasImg
        , a.imgs
        , json_object( 'avatar_url',c.avatar_url
                     , 'nickname'   ,  c.nickname
                      ,'username' , c.username
                   ) user                     
        , json_object( 'like' , if(f.count  ,f.count,0)
                     , 'scrap', if(g.user_id  ,1,0)
                     ,'hasImgs' , ifnull(json_length(a.imgs),0)
                     ) as user_action
        ,  ( select max(x.best_id)
             from   best_contents x
             where  d.best_id > x.best_id         
             and    d.best_roll = x.best_roll
             and    d.best_type = x.best_type ) pre_best_id                     
    from   contents a
            left join content_like_users f on a.content_id = f.content_id and f.user_id  = ?
            left join content_scrap_users g on a.content_id = g.content_id and g.user_id  = ?
            left join user_info c on a.user_id = c.user_id
        ,  boards b
        ,  best_contents d
    where a.board_id = b.board_id
    and   ifnull(a.deleted, 0) != 1
    and   a.content_id = d.content_id
    and   d.best_id = ( select max(x.best_id)
                        from   best_contents x
                        where  x.best_id <= ?
                        and    x.best_roll = ?
                        and    x.best_type = 'D'
                        and    x.latest = 1 )
    and   d.best_type = 'D'
    and   d.best_roll = ?
    and   d.latest = 1
    order by d.best_id desc
        , d.best_roll
        , case when best_roll = 'C' then comments else likers end desc
    ;
    `

    db.excuteSql(query, [userid, userid, bestid, bestRoll, bestRoll], function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        return res.status(200).json(result);
    })    
};



exports.getBestBoards = (req,res) => {
    
    let boardid = req.params.boardid;
    let bestid = req.query.bestid;
    let bestType = req.query.type;
    let bestRoll = req.query.roll;

    let userid = (req.user?req.user.userid : undefined)

    if (!bestType) { bestType = 'D' }

    if (!bestRoll) { bestRoll = 'C' }
    //2. excute query
    var query = 
    `
    select d.best_id
        , d.best_roll
        , a.content_id
        , a.title
        , a.arena_id
        , a.deleted
        , a.reported
        , a.comments
        , a.scraps
        , a.board_id
        , a.preview
        , a.likers
        , a.tags
        , a.bodytype  
        , a.celltype  
        , a.link
        , a.created
        , a.updated
        , ifnull(json_length(a.imgs),0) hasImg
        , a.imgs
        , json_object( 'avatar_url',c.avatar_url
                        , 'nickname'   ,  c.nickname
                        ,'username' , c.username
                    ) user
        , json_object( 'like' , if(f.count  ,f.count,0)
                     , 'scrap', if(g.user_id  ,1,0)
                     ,'hasImgs' , ifnull(json_length(a.imgs),0) ) as user_action                               
        ,  ( select max(x.best_id)
             from   best_contents x
             where  d.best_id > x.best_id         
             and    d.best_roll = x.best_roll
             and    d.best_type = x.best_type ) pre_best_id
    from   contents a
            left join content_like_users f on a.content_id = f.content_id and f.user_id  = ?
            left join content_scrap_users g on a.content_id = g.content_id and g.user_id  = ?
            left join user_info c on a.user_id = c.user_id
        ,  boards b
        ,  best_contents d
    where a.board_id = b.board_id
    and   ifnull(a.deleted, 0) != 1
    and   a.content_id = d.content_id
    and   a.board_id = ?
    and   d.best_id = ( select max(x.best_id)
                        from   best_contents x
                        where  x.best_id <= ?
                        and    x.best_roll = ?
                        and    x.best_type = 'D'
                        and    x.latest = 1 )
    and   d.best_type = 'D'
    and   d.best_roll = ?
    and   d.latest = 1
    order by d.best_id desc
        , d.best_roll
        , case when best_roll = 'C' then comments else likers end desc
    ;
    `    


    db.excuteSql(query, [userid, userid, boardid, bestid, bestRoll, bestRoll], function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        return res.status(200).json(result);
    })    
};




//------------------------------
// 베스트 글 임시버전
//------------------------------

exports.getBestsContents = (req,res) => {
    
    let bestRoll = req.query.roll;
    let userid = (req.user?req.user.userid : undefined)


    //2. Input data valid check 
    if (!bestRoll) { bestRoll = 'C' }

    //3. excute query
    var query = 

    `
    select a.content_id
        , a.title
        , a.arena_id
        , a.deleted
        , a.reported
        , a.comments
        , a.scraps
        , a.board_id
        , a.preview
        , a.likers
        , a.tags
        , a.bodytype  
        , a.celltype  
        , a.link
        , a.created
        , a.updated
        , ifnull(json_length(a.imgs),0) hasImg
        , a.imgs
        , json_object( 'avatar_url',c.avatar_url
                     , 'nickname'   ,  c.nickname
                      ,'username' , c.username
                   ) user                     
        , json_object( 'like' , if(f.count  ,f.count,0)
                     , 'scrap', if(g.user_id  ,1,0)
                     ,'hasImgs' , ifnull(json_length(a.imgs),0)
                     ) as user_action
    from   contents a
            left join content_like_users f on a.content_id = f.content_id and f.user_id  = ?
            left join content_scrap_users g on a.content_id = g.content_id and g.user_id  = ?
            left join user_info c on a.user_id = c.user_id
        ,  boards b
    where a.board_id = b.board_id
    and   ifnull(a.deleted, 0) != 1
    and   b.has_best = 1
    and   date(a.created) between date_sub(now(), interval 7 day) and now()
    and   (     ( ? = 'C' and a.comments > 0 )
             or ( ? = 'L' and a.likers > 0   )
          )
    order by case when ? = 'C' then a.comments else a.likers end desc
    limit 15
    ;
    `

    db.excuteSql(query, [userid, userid, bestRoll, bestRoll, bestRoll], function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        return res.status(200).json(result);
    })    
};

exports.getBoardBestContents = (req,res) => {
    
    let bestRoll = req.query.roll;
    let userid = (req.user?req.user.userid : undefined)
    let boardid = req.params.boardid

    //2. Input data valid check 
    if (!bestRoll) { bestRoll = 'C' }
    

    //3. excute query
    var query = 

    `
    select a.content_id
        , a.title
        , a.arena_id
        , a.deleted
        , a.reported
        , a.comments
        , a.scraps
        , a.board_id
        , a.preview
        , a.likers
        , a.tags
        , a.bodytype  
        , a.celltype  
        , a.link
        , a.created
        , a.updated
        , ifnull(json_length(a.imgs),0) hasImg
        , a.imgs
        , json_object( 'avatar_url',c.avatar_url
                     , 'nickname'   ,  c.nickname
                      ,'username' , c.username
                   ) user                     
        , json_object( 'like' , if(f.count  ,f.count,0)
                     , 'scrap', if(g.user_id  ,1,0)
                     ,'hasImgs' , ifnull(json_length(a.imgs),0)
                     ) as user_action
    from   contents a
            left join content_like_users f on a.content_id = f.content_id and f.user_id  = ?
            left join content_scrap_users g on a.content_id = g.content_id and g.user_id  = ?
            left join user_info c on a.user_id = c.user_id
        ,  boards b
    where a.board_id = b.board_id
    and   ifnull(a.deleted, 0) != 1
    and   b.has_best = 1
    and   date(a.created) between date_sub(now(), interval 7 day) and now()
    and   a.board_id = ?
    and   (     ( ? = 'C' and a.comments > 0 )
             or ( ? = 'L' and a.likers > 0   )
          )
    order by case when ? = 'C' then a.comments else a.likers end desc
    limit 15
    ;
    `

    db.excuteSql(query, [userid, userid, boardid, bestRoll, bestRoll, bestRoll], function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        return res.status(200).json(result);
    })    
};