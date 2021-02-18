const db = require('../../../services/mysqlservice');
const pushService = require('../../../services/pushservice')


/**
 * 로그인된 사용자 기본정보를 가져온다. 
 */
exports.getLoginUser = (req, res) => {

    var userid = req.user.userid;

    var query = 
    `
    select a.username                                    username
        ,  a.nickname                                    nickname
        ,  a.profile                                     profile
        ,  a.avatar_url                                  avatar_url
    from   user_info a
    where  a.user_id = ?
    `
    var parameter = [userid]

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        const user = result[0]

        if (!user) {
            return res.status(400).json({result : 0, message : "회원이 없습니다"});
        }

        return res.status(200).json(user);
    })
};

/**
 * 사용자 기본정보를 가져온다. 
 */
exports.getUser = (req, res) => {

    var username = req.params.username;

    var query = 
    `
    select a.username                                    username
        ,  a.nickname                                    nickname
        ,  a.profile                                     profile
        ,  a.avatar_url                                  avatar_url
    from   user_info a
    where  a.username = ?
    `
    var parameter = [username]

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
        const user = result[0]

        if (!user) {
            return res.status(404).json({result : 0, message :  'not found user'})
        }

        return res.status(200).json(user);
    })
};

exports.createUser = (req, res ) => {
   
    var login_path        = req.body.login_path;
    var email             = req.body.email;
    var username          = req.body.username;
    var profile           = req.body.profile;
    var avatar_url        = req.body.avatar_url;
    var favorite_team     = req.body.favorite_team;
    var favorite_player   = req.body.favorite_player;
    var favorite_site     = req.body.favorite_site;
    var favorite_national = req.body.favorite_national;

    var query =
    `
    insert into user_info
    (login_path, email, username, profile, avatar_url, favorite_team, favorite_player, favorite_site, favorite_national)
    values (?,?,?,?,?,?,?,?,?) 
    `

    var parameter = [login_path, email, username, profile, avatar_url, favorite_team, favorite_player, favorite_site, favorite_national];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json({result : 1, message :  "success"})
    } )
};

exports.updateLoginUser =(req, res) => {
    
    var userid = req.user.userid;

    var nickname          = req.body.nickname;
    var profile           = req.body.profile;
    var avatarUrl        = req.body.avatarurl; 
    //var favorite_team     = req.body.favorite_team;
    //var favorite_player   = req.body.favorite_player;
    //var favorite_site     = req.body.favorite_site;
    //var favorite_national = req.body.favorite_national;
    var parameter = []
    var hasSet = false
    var setCause = ''
    var header = 'update user_info'
    var whereCause = ' where  user_id = ?'
    
    if (nickname ) {
        hasSet = true
        setCause = ' set nickname = ? '
        parameter.push(nickname)
    }
    if (profile) {
        if (hasSet){
            setCause = setCause + ' ,  profile = ? '
            
        }else {
            setCause = ' set profile = ? '
        }
        parameter.push(profile)
    }
    if (avatarUrl) {
        if (hasSet){
            setCause = setCause + ' ,  avatar_url  = ? '
            
        }else {
            setCause = ' set avatar_url = ? '
        }
        parameter.push(avatarUrl)
    }

    parameter.push(userid)
    

    var query = header + setCause + whereCause


    

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json({result : 1, message :  "success"})
    } )
};

/**
 * 프로필 사진 변경
 */
exports.updateAvatar =(req, res) => {

    var userid = req.user.userid;
    var avatar_url        = req.body.avatar_url;


    var query =
    `
    update user_info
    set    avatar_url        = ?
    where  user_id          = ?
    ;
    `

    var parameter = [avatar_url, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(200).json({result : 1, message :  "success"})
    } )
};


exports.deleteLoginUser = ( req, res) => {

};


exports.updateUser = ( req, res) => {

};



/*-----------------------------------------------------------*/


exports.getUserContentList = (req,res) => {

        //1. validate check 
        // offset=10&limit=5
        let username = req.params.username;
        let offset = req.query.offset;
        let limit = req.query.limit ;
        let boardid = req.query.boardid;

        if (!offset) {
            offset = 0
            // return res.status(400).json({error: 'Incorrect offset'});
        }
    
        if (!limit) {
            limit = 15
            // return res.status(400).json({error: 'Incorrect limit'});
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
                , a.likers
                , a.tags
                , a.imgs
                , a.bodytype   
                , a.celltype                      
                , a.link            
                , a.created
                , a.updated
                , json_object( 'avatar_url',c.avatar_url
                                , 'nickname'   ,  c.nickname
                                ,'username' , c.username
                ) user
            from contents a
                    left join arena.matches m on m.match_id = a.arena_id
                    left join arena.teams lt on m.localteam_id = lt.team_fa_id
                    left join arena.teams vt on m.visitorteam_id = vt.team_fa_id
                    left join arena.players p on a.player_id = p.player_id
                    ,boards b
                    ,user_info c 
            where a.board_id = b.board_id
                and a.user_id = c.user_id
                and ifnull(a.deleted, 0) != 1
                and b.board_id  = ifnull(?, b.board_id )                
                and c.username = ?
        order by content_id desc
        limit ?
        offset ? 
        `;
    
        var parameter = [boardid, username, limit, offset]
    
        db.excuteSql(query, parameter, function (err, result){
            if (err) {
                return res.status(400).json({result : 0, message :  err.message})
            }
            //success
            return res.status(200).json(result);
        })
    };


exports.getUserCommentList = (req,res) => {
    
        //1. validate check 
        // offset=10&limit=5
        let username = req.params.username;
        let offset = req.query.offset;
        let limit = req.query.limit ;
    
        if (!offset) {
            offset = 0
        }
    
        if (!limit) {
            limit = 15
        }
        
        //2. excute query
        let query = 
        `
        select c.created content_created
             , c.comments content_comments
             , c.likers content_likers
             , c.scraps content_scraps
             , json_object( 'avatar_url' , d.avatar_url
                          , 'user_id'   ,  d.user_id
                          , 'username'  ,  d.username ) content_user                 
             , a.comment_id
             , a.parent_id
             , a.depth
             , a.content_id
             , c.title
             , a.content
             , a.likers
             , a.deleted
             , a.reported
             , a.created
             , a.updated
             , json_object( 'avatar_url' , b.avatar_url
                            , 'nickname'   ,  b.nickname
                            , 'username'  ,  b.username ) user
        from  comments a,
              user_info b,
              contents c,
              user_info d
        where a.user_id = b.user_id
        and   b.username = ?
        and   c.deleted = 0
        and   a.content_id = c.content_id
        and   c.deleted = 0
        and   c.user_id = d.user_id
        order by a.updated desc
        limit ?
        offset ? 
        ;
        `;
    
        var parameter = [username, limit, offset]
    
        db.excuteSql(query, parameter, function (err, result){
            if (err) {
                return res.status(400).json({result : 0, message :  err.message})
            }
            //success
            return res.status(200).json(result);
        })
    };


exports.getUserHifivedContentList = (req,res) => {
    
//1. validate check 
    // offset=10&limit=5
    let offset = req.query.offset;
    let limit = req.query.limit ;
    let userid = (req.user?req.user.userid : undefined) // 나
    let previewMode = req.query.preview;
    let exarena = req.query.exarena;

    let username = req.params.username; // 프로필 대상자

    if (!offset) {
        offset = 0
    }

    if (!limit) {
        limit = 15
    }

    if ( !exarena ) {
        exarena = 0;
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
            , a.likers
            , a.tags
            , a.imgs
            , a.bodytype   
            , a.celltype                      
            , a.link            
            , a.created
            , a.updated
            , json_object( 'avatar_url',c.avatar_url
                            , 'nickname'   ,  c.nickname
                            ,'username' , c.username
            ) user
        from contents a
                left join arena.matches m on m.match_id = a.arena_id
                left join arena.teams lt on m.localteam_id = lt.team_fa_id
                left join arena.teams vt on m.visitorteam_id = vt.team_fa_id
                left join arena.players p on a.player_id = p.player_id                  
        , boards b
        , user_info c 
        , content_like_users s
        , user_info su
        where a.board_id = b.board_id
        and   a.user_id = c.user_id
        and   ifnull(a.deleted, 0) != 1
        and   s.content_id = a.content_id
        and   s.user_id = su.user_id
        and   su.username = ?
        order by  content_id desc
        limit ?
        offset ? 
    `;

    var parameter = [ username, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message});
        }
        //success
        return res.status(200).json(result);
    })
};        

exports.getUserScrapContentList = (req,res) => {
    
    //1. validate check 
    // offset=10&limit=5
    let offset = req.query.offset;
    let limit = req.query.limit ;
    let previewMode = req.query.preview;
    let exarena = req.query.exarena;

    let username = req.params.username; // 프로필 대상자

    if (!offset) {
        offset = 0
    }

    if (!limit) {
        limit = 15
    }

    if ( !exarena ) {
        exarena = 0;
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
            , a.likers
            , a.tags
            , a.imgs
            , a.bodytype   
            , a.celltype                      
            , a.link            
            , a.created
            , a.updated
            , json_object( 'avatar_url',c.avatar_url
                            , 'nickname'   ,  c.nickname
                            ,'username' , c.username
            ) user
        from contents a
                left join arena.matches m on m.match_id = a.arena_id
                left join arena.teams lt on m.localteam_id = lt.team_fa_id
                left join arena.teams vt on m.visitorteam_id = vt.team_fa_id
                left join arena.players p on a.player_id = p.player_id                  
        , boards b
        , user_info c 
        , content_scrap_users s
        , user_info su
        where a.board_id = b.board_id
        and   a.user_id = c.user_id
        and   ifnull(a.deleted, 0) != 1
        and   s.content_id = a.content_id
        and   s.user_id = su.user_id
        and   su.username = ?
        order by  content_id desc
        limit ?
        offset ? 
    `;

    var parameter = [ username, limit , offset]

    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message :  err.message});
        }
        //success
        return res.status(200).json(result);
    })
};


exports.getFavoritePlayerList = (req, res) => {

    let username = req.params.username;

    var query =
    `
    select p.player_id id
        , ifnull(ifnull(p.player_short_name_kor, p.player_name_kor),p.player_common_name) name
        , p.soccerwiki_id
        , json_object(
            "id" , t.team_id
            ,"name"        , ifnull(t.team_name_kor, t.team_name)
            ,"emblem_id"   , t.team_fm_id
        ) team
        , json_object(
            "id" , tn.team_id
            ,"name"        , ifnull(tn.team_name_kor, tn.team_name)
            ,"emblem_id"   , tn.team_fm_id
        ) national_team        
        , p.overview
    from
    hifive.user_info doc,
    json_table(
                    doc.favorite_players ,
                    '$[*]'
                    columns(
                        id int(11) path "$"
                        )
                ) as playerlist
    ,arena.players p
      left join  arena.teams t on t.team_fa_id = p.teamid
      left join  arena.teams tn on tn.team_fa_id = p.national_teamid
    where playerlist.id = p.player_id
    and doc.username = ?;
    ;
    `

    var parameter = [username];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(200).json(result)
    } )
};


exports.createFavoritePlayer = (req,res) => {
    
    let username = req.params.username;
    let userid = req.user.userid
    let playerIdList = req.body/player_id_list
    //
    var query =
    `
    replace into user_info
      set favorite_players = ?
    where user_id = ?
    ;
    `

    var parameter = [ playerIdList, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(200).json({result : 1, message :  "success"})
    } )
}

exports.registerDevice = (req,res) => {

    let userid = req.user.userid
    
    let deviceInfo = {}
    deviceInfo.uuid = userid
    deviceInfo.deviceId = req.body.device_id
    deviceInfo.pushType = req.body.push_type
    deviceInfo.pushToken = req.body.push_token

    pushService.register(deviceInfo, (err, result) => {
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(200).json({result : 1, message :  "푸쉬서비스 등록완료"})
    })
}

exports.deRegisterDevice = (req,res) => {
    let userid = req.user.userid

    let deviceInfo = {}
    deviceInfo.uuid = userid
    deviceInfo.deviceId = req.body.device_id
    deviceInfo.pushType = req.body.push_type

    pushService.deRegister(deviceInfo, (err, result) => {
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }

        return res.status(200).json({result : 1, message :  "삭제완료"})        
    })
}

exports.hasRegisterDevice = (req,res) => {
    let userid = req.user.userid

    pushService.hasTokens(deviceInfo, (err, result) => {
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        return res.status(200).json({result : 1, message :  "디바이스 등록되어있음"})         
    })
}


//test
exports.callback = (req,res) => {
    console.log(req.body)
    return res.status(200).send()
}