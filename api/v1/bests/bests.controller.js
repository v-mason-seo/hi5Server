
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



////



exports.getBasicBests = (req,res) => {
    
    
    let bestType = req.query.type;
    let bestRoll = req.query.roll;
    
    //2. Input data valid check 
    if (!bestType) { bestType = 'D' }

    if (!bestRoll) { bestRoll = 'C' }

    //1. validate check 

    // offset=10&limit=5
    let offset = req.query.offset;
    let limit = req.query.limit ;
    let boardid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)


    if (!offset) {offset = 0}

    if (!limit) {limit = 15}

    if (!boardid) {
        return res.status(400).json({error: 'Incorrect boardid'});
    }

    if ( !exarena ) {
        exarena = 0;
    }

    if ( !explayer ) {
        explayer = 0;
    }


    //2. excute query
    let query = 
    `
    select a.content_id
            , a.title
            , if(a.arena_id is null , null
                , json_object(
                    "match_id", a.arena_id
                    ,"match_date", DATE_FORMAT(m.match_date_utc   ,'%Y-%m-%dT%T.000Z')           
                    ,"home_team" ,json_object(
                                            "id"           , lt.team_id
                                            ,"emblem_id"   , lt.team_fm_id 
                                            ,"name"        , ifnull(ifnull(lt.team_name_kor ,lt.team_short_name_kor ) , lt.team_name)
                                        )                                                                                                 
                    ,"away_team",json_object(
                                            "id"           , vt.team_id 
                                            ,"emblem_id"   , vt.team_fm_id 
                                            ,"name"        , ifnull(ifnull(vt.team_name_kor ,vt.team_short_name_kor )  , vt.team_name)
                                            )	
                    ,"home_score" , if(m.status='Pen.', concat(m.localteam_score,'(',m.penalty_local,')') , m.localteam_score)
                    ,"away_score" , if(m.status='Pen.', concat(m.visitorteam_score,'(',m.penalty_visitor,')') , m.visitorteam_score)
                )
            ) as 'match'           
            , if(a.player_id is null, null
                , ( json_object("id", a.player_id
                               ,"name", ifnull(p.player_name_kor, p.player_common_name)
                               ,"soccerwiki_id", p.soccerwiki_id
                               )
                  )
               ) as player
            , a.deleted
            , a.reported
            , a.comments
            , a.scraps
            , a.board_id
            , a.preview
            , a.content
            , a.likers
            , a.tags
            , a.imgs
            , a.created
            , a.updated
            , a.bodytype  
            , a.celltype          
            , a.link
            , json_object( 'avatar_url',c.avatar_url
                          , 'nickname'   ,  c.nickname
                           ,'username' , c.username
                        ) user
            , json_object( 'like' , if(d.count  ,d.count,0)
                        , 'scrap', if(e.user_id  ,1,0)
                        ,'hasImgs' , ifnull(json_length(a.imgs),0)
                        ) as user_action                        
        from contents a
                    left join content_like_users d on a.content_id = d.content_id and d.user_id  = ?
                    left join content_scrap_users e on a.content_id = e.content_id and e.user_id  = ?
                    left join arena.matches m on m.match_id = a.arena_id
	                left join arena.teams lt on m.localteam_id = lt.team_fa_id
                    left join arena.teams vt on m.visitorteam_id = vt.team_fa_id
                    left join arena.players p on a.player_id = p.player_id
                ,boards b
                ,user_info c 
        where a.board_id = b.board_id
            and a.user_id = c.user_id
            and ifnull(a.deleted, 0) != 1
            and a.board_id = ?   
    order by content_id desc
    limit ?
    offset ? 
    `;

    var parameter = [previewMode, userid, userid, boardid, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message});
        }
        //success
        return res.status(200).json(result);
    })
};


//------------------------------
// 베스트 글 임시버전
//------------------------------

exports.getTempBestAllList = (req,res) => {
    
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

exports.getTempBestList = (req,res) => {
    
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