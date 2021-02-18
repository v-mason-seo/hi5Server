
let db = require('../../../services/mysqlservice');


//http://127.0.0.1:5200/board?board_type=1&limit=15&offset=0
exports.getBoardContentList = (req,res) => {

    //1. validate check 

    // offset=10&limit=5
    let offset = req.query.offset? req.query.offset : 0
    let limit = req.query.limit? req.query.limit : 10
    let boardid = req.params.id;
    let userid = (req.user ? req.user.userid : undefined)
    let previewMode = req.query.preview;
    let exarena = req.query.exarena;
    let explayer = req.query.explayer;

    if (!boardid) {
        return res.status(400).json({result : 0, message :  'Incorrect boardid'});
    }

    if ( !exarena ) exarena = 0

    if ( !explayer ) explayer = 0

    //2. excute query
    let query = 
    `
    select a.content_id
        ,  a.title
        ,  if(a.arena_id is null , null
                                 , json_object(
                "comp",json_object(
                    "id" , cp.comp_id
                    ,"nm", ifnull(cp.comp_name_kor, cp.comp_name) 
                    ,"comp_image_id", cp.comp_fm_id
                )                               
                ,"match_id", a.arena_id
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
                ,"status"     , m.status
                ,"season"     , m.season
                ,"week"       , m.week
            )
        ) as 'match'           
        , if(a.player_id is null , null
            , json_object(
                "id", p.player_id
                ,"name" ,ifnull(ifnull(p.player_short_name_kor, p.player_name_kor),p.player_common_name)
                ,"team" ,json_object (
                    "name", ifnull(ifnull(pt.team_short_name_kor ,pt.team_short_name )  , pt.team_name)
                    ,"id" , pt.team_id
                    ,"emblem_id", pt.team_fm_id
                )
                ,"national_team", json_object(
                    "id" , tn.team_id
                    ,"name"        , ifnull(ifnull(tn.team_short_name_kor ,tn.team_short_name ) , tn.team_name)
                    ,"emblem_id"   , tn.team_fm_id
                )
            )
        ) as player  
        , if(a.team_id is null , null
            , json_object(
                    "name", ifnull(ifnull(t.team_short_name_kor ,t.team_short_name )  , t.team_name)
                    ,"id" , t.team_id             
                    ,"emblem_id", t.team_fm_id 
            )
        ) as team                  
        ,  a.deleted
        ,  a.reported
        ,  a.comments
        ,  a.scraps
        ,  a.board_id
        ,  a.preview
        ,  if(1 = ? or  a.bodytype = 3 , a.content, null) content
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
                     , 'username' , c.username ) user
        , json_object( 'like' , if(d.count  ,d.count,0)
                    , 'scrap', if(e.user_id  ,1,0)
                    ,'hasImgs' , ifnull(json_length(a.imgs),0)
                    ) as user_action                        
    from contents a
         left join content_like_users d  on a.content_id = d.content_id and d.user_id  = ?
         left join content_scrap_users e on a.content_id = e.content_id and e.user_id  = ?
         left join arena.matches m       on m.match_id = a.arena_id
         left join arena.competitions cp on cp.comp_fa_id = m.comp_fa_id
         left join arena.teams lt        on m.localteam_id = lt.team_fa_id
         left join arena.teams vt        on m.visitorteam_id = vt.team_fa_id
         left join arena.players p       on a.player_id = p.player_id
         left join arena.teams pt        on pt.team_fa_id = p.teamid
         left join arena.teams tn        on tn.team_fa_id = p.national_teamid
         left join arena.teams t         on a.team_id = t.team_id         
      ,  boards b
      ,  user_info c 
    where a.board_id            = b.board_id
    and   a.user_id             = c.user_id
    and   ifnull(a.deleted, 0) != 1
    and   a.board_id            = ?
    and   ( !( ? = 1 and a.arena_id is not null and a.player_id is null) or ? = 0 )
    and   ( !( ? = 1 and a.player_id is not null) or ? = 0)       
    order by content_id desc
    limit  ?
    offset ? 
    `;

    var parameter = [previewMode, userid, userid, boardid, exarena, exarena, explayer, explayer, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message});
        }
        //success
        return res.status(200).json(result);
    })
};


/**
 * 전체 게시판 데이터 조회
 *  - http://127.0.0.1:5300/v1/boards
 *  - 
 * @param {*} req 
 * @param {*} res 
 */
exports.getBoardALLContentList = (req,res) => {

    //----------------------------------
    // 1. validate check 
    //----------------------------------

    let offset        = req.query.offset ? req.query.offset : 0
    let limit         = req.query.limit ? req.query.limit : 10
    let userid        = (req.user ? req.user.userid : undefined)
    let exmatchtalk   = req.query.exmatchtalk;
    let exmatchreport = req.query.exmatchreport;
    let exnews        = req.query.exnews;

    if ( !exmatchtalk ) {
        exmatchtalk = 0
    }

    if ( !exmatchreport ) {
        exmatchreport = 0
    }

    if ( !exnews ) {
        exnews = 1
    }


    //----------------------------------
    // 2. query
    //----------------------------------

    let query = 
    `
    select a.content_id
        ,  a.title
        ,  a.deleted
        ,  a.reported
        ,  a.comments
        ,  a.scraps
        ,  a.board_id
        ,  a.preview
        ,  a.likers
        ,  a.tags
        ,  a.imgs
        ,  a.bodytype   
        ,  a.celltype                      
        ,  a.link            
        ,  a.created
        ,  a.updated
        #-----------------------------------------------------------------
        ,  if(a.arena_id is null , null
            , json_object(
                  "comp",json_object( "id", cp.comp_id,
                                      "nm", ifnull(cp.comp_name_kor, cp.comp_name),
                                      "comp_image_id", cp.comp_fm_id ), 
                  "match_id"  , a.arena_id,
                  "match_date", DATE_FORMAT(m.match_date_utc, '%Y-%m-%dT%T.000Z') ,
                  "home_team" , json_object( "id"          , lt.team_id, 
                                             "emblem_id"   , lt.team_fm_id, 
                                             "name"        , ifnull(ifnull(lt.team_name_kor ,lt.team_short_name_kor ) , lt.team_name) ),
                  "away_team" , json_object( "id"          , vt.team_id,
                                             "emblem_id"   , vt.team_fm_id,
                                             "name"        , ifnull(ifnull(vt.team_name_kor ,vt.team_short_name_kor )  , vt.team_name) ),
                  "home_score", m.localteam_score,
                  "away_score", m.visitorteam_score,
                  "status"    , m.status,
                  "season"    , m.season,
                  "week"      , m.week
               )
           ) as 'match'              
        #-----------------------------------------------------------------
        ,  if(a.player_id is null , null
                , json_object(
                      "id", p.player_id,
                      "soccerwiki_id" , p.soccerwiki_id,
                      "name" ,ifnull(ifnull(p.player_short_name_kor, p.player_name_kor), p.player_common_name ),
                      "team" ,json_object ( "name"     , ifnull(ifnull(pt.team_short_name_kor ,pt.team_short_name ), pt.team_name ),
                                            "id"       , pt.team_id,
                                            "emblem_id", pt.team_fm_id )
               )
           ) as 'player'       
        #-----------------------------------------------------------------
        ,  if(a.team_id is null, null
            , json_object( "name"     , concat(  ifnull(ifnull(t.team_short_name_kor ,t.team_short_name ), t.team_name)
	                                           ,  ' ('
	                                           ,  '  순위: ', if ( JSON_UNQUOTE(json_extract(t.statistics, "$[0].rank")) = 'null', '-', JSON_UNQUOTE(json_extract(t.statistics, "$[0].rank")))
                                 	           ,  ', 승: ', if ( JSON_UNQUOTE(json_extract(t.statistics, "$[0].wins"))   = 'null', '-', JSON_UNQUOTE(json_extract(t.statistics, "$[0].wins")))
                                 	           ,  ', 무: ', if ( JSON_UNQUOTE(json_extract(t.statistics, "$[0].draws"))  = 'null', '-', JSON_UNQUOTE(json_extract(t.statistics, "$[0].draws")))
                                 	           ,  ', 패: ', if ( JSON_UNQUOTE(json_extract(t.statistics, "$[0].losses")) = 'null', '-', JSON_UNQUOTE(json_extract(t.statistics, "$[0].losses")))
                                 	           ,  ', 골: ', if ( JSON_UNQUOTE(json_extract(t.statistics, "$[0].goals"))  = 'null', '-', JSON_UNQUOTE(json_extract(t.statistics, "$[0].goals")))
                                               ,  ' )'
                                 	          )  ,
                           "id"       , t.team_id,
                           "emblem_id", t.team_fm_id,
									"info"     , json_extract(t.statistics, "$[0].wins")  ) 
           ) as team
        #-----------------------------------------------------------------
        ,  json_object( 'avatar_url', c.avatar_url,
                        'nickname'  , c.nickname,
                        'username'  , c.username  ) as user
        #-----------------------------------------------------------------
        ,  json_object( 'like'   , if(d.count  ,d.count,0),
                        'scrap'  , if(e.user_id  ,1,0),
                        'hasImgs', ifnull(json_length(a.imgs),0)  ) as user_action  
        #-----------------------------------------------------------------            
    from  contents a
          left join content_like_users d   on a.content_id = d.content_id and d.user_id  = ?
          left join content_scrap_users e  on a.content_id = e.content_id and e.user_id  = ?
          left join arena.matches m        on m.match_id = a.arena_id
          left join arena.competitions cp  on cp.comp_fa_id = m.comp_fa_id
          left join arena.teams lt         on m.localteam_id = lt.team_fa_id
          left join arena.teams vt         on m.visitorteam_id = vt.team_fa_id
          left join arena.players p        on a.player_id = p.player_id
          left join  arena.teams pt        on pt.team_fa_id = p.teamid   
          left join arena.teams t          on a.team_id = t.team_id              
      ,   boards b
      ,   user_info c 
    where a.board_id = b.board_id
    and   a.user_id = c.user_id
    and   ifnull(a.deleted, 0) != 1
    and   b.board_id in (200, 250, 300, 400, 610)
    and   ( ( ? != 0 and b.board_id != 250) or ? = 0 )
    and   ( ( ? != 0 and b.board_id != 610) or ? = 0 )
    and   ( ( ? != 0 and b.board_id != 300) or ? = 0 )
    order by content_id desc
    limit  ?
    offset ? 
    `;


    //----------------------------------
    // 3. excute query
    //----------------------------------

    var parameter = [ userid, userid, exmatchtalk, exmatchtalk, exmatchreport, exmatchreport, exnews, exnews, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message});
        }
        //success
        return res.status(200).json(result);
    })
};


// best

exports.getBestBoards = (req,res) => {
    
    let boardid = req.params.id;
    let bestid = req.query.bestid;
    let bestType = req.query.type;
    let bestRoll = req.query.roll;
    let offset = req.query.offset? req.query.offset : 0
    let limit = req.query.limit? req.query.limit : 10
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
        , a.link
        , a.created
        , a.updated
        , ifnull(json_length(a.imgs),0) hasImg
        , a.imgs
        , json_object( ' avatar_url', c.avatar_url
                       , 'user_id', c.user_id
                       , 'username', c.username
                       , 'nickname',  c.nickname ) user
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


    db.excuteSql(query, [userid, userid, boardid, bestid, bestRoll, bestRoll/*, limit, offset*/], function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        return res.status(200).json(result);
    })    
};
    

//issue

exports.getIssueBoardContentList = (req,res) => {
    
    let offset = req.query.offset? req.query.offset : 0
    let limit = req.query.limit? req.query.limit : 10
    let boardid = req.params.id
    let userid = (req.user?req.user.userid : undefined)
    let closed = req.query.closed?req.query.closed:0
    //userid check
    if (!boardid) {
        return res.status(403).json({result : 0, message :  "boardid bad"})
    }


    //2. excute query
    let query = 
    `
    select   f.issue_id
            ,f.closed
            ,f.activity
            ,f.progress
            ,f.platform
            ,f.tags
            ,json_object(                
                        'content_id', a.content_id
                        , 'title', a.title
                        , 'deleted', a.deleted
                        , 'reported', a.reported
                        , 'comments', a.comments
                        , 'scraps', a.scraps
                        , 'board_id', a.board_id
                        , 'likers', a.likers
                        , 'tags', a.tags
                        , 'created', DATE_FORMAT( CONVERT_TZ(a.created, @@session.time_zone, '+00:00')  ,'%Y-%m-%dT%T.000Z')
                        , 'updated', DATE_FORMAT( CONVERT_TZ(a.updated, @@session.time_zone, '+00:00')  ,'%Y-%m-%dT%T.000Z')
            ) contents
            , json_object( 'avatar_url', c.avatar_url
                            , 'nickname'  , c.nickname
                            , 'username'  , c.username
                        ) user
            , json_object( 'like' , if(d.count  ,d.count,0)
                        , 'scrap' , if(e.user_id  ,1,0)
                        , 'hasImgs' , ifnull(json_length(a.imgs),0)
                        ) as user_action                        
        from contents a
                    left join content_like_users d on a.content_id = d.content_id and d.user_id  = ?
                    left join content_scrap_users e on a.content_id = e.content_id and e.user_id  = ?
                ,boards b
                ,user_info c 
                , issues f             
        where a.board_id = b.board_id
            and a.user_id = c.user_id
            and a.content_id = f.content_id       
            and ifnull(a.deleted, 0) != 1
            and a.board_id = ?
            and ((? = 1 and f.closed is not null) or (? = 0 and f.closed is  null))
    order by f.closed desc, a.content_id desc
    limit ?
    offset ? 
    `;

    const parameter = [userid, userid, boardid, closed, closed, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err})
        }
        //success
        return res.status(200).json(result);
    })
};



exports.getIsExistNewContents = (req, res) => {
    
    let boardid = req.params.id;
    let contentid = req.query.contentid;

    //if closed < now  => return 

    let query =
    `
    select if(count(*) = 0 , 0, 1) as exist
      from contents
     where board_id = ?
       and content_id > ?
    limit 1
    `

    let parameter = [boardid, contentid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json({result :  result[0].exist });
    } )
};
