
const db = require('../../../services/mysqlservice')
const badge = require('../../../services/badge')
const notification = require('../../../services/notification');
const footballchat = require('../../../services/footballchat')

exports.getContent = ( req, res) => {

    let contentid = req.params.id;
    let userid = (req.user?req.user.userid : undefined)

    let query = 
    `
    select 
          a.content_id 
       ,  a.board_id
       ,  a.title
       ,  a.content
       , if(a.arena_id is null , null
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
                ,"soccerwiki_id" , p.soccerwiki_id
                ,"name" ,ifnull(ifnull(p.player_short_name_kor, p.player_name_kor),p.player_common_name)
                ,"team" ,json_object (
                    "name", ifnull(ifnull(pt.team_short_name_kor ,pt.team_short_name )  , pt.team_name)
                    ,"id" , pt.team_id             
                    ,"emblem_id", pt.team_fm_id
                )
                ,"national_team" ,json_object(
                    "id" , tn.team_id
                    ,"name"        , ifnull(ifnull(tn.team_short_name_kor ,tn.team_short_name ) , tn.team_name)
                    ,"emblem_id"   , tn.team_fm_id
                )
            )
        ) as 'player'             
        , if(a.team_id is null , null
            , json_object(
                    "name", ifnull(ifnull(t.team_short_name_kor ,t.team_short_name )  , t.team_name)
                    ,"id" , t.team_id             
                    ,"emblem_id", t.team_fm_id 
                
            )
        ) as team
       ,  a.comments
       ,  a.likers
       ,  a.scraps
       ,  a.tags
       ,  a.imgs
       ,  a.ip
       ,  a.deleted
       ,  a.reported
       ,  a.created
       ,  a.updated          
       ,  a.allow_comment
       ,  a.bodytype
       ,  a.celltype       
       ,  a.link
       , json_object( 'avatar_url',c.avatar_url
                    , 'nickname'   ,  c.nickname
                    , 'username' , c.username
                    , 'profile', c.profile
                ) user
        , json_object( 'like' , if(d.count  ,d.count,0)
        , 'scrap', if(e.user_id  ,1,0)
        ,'hasImgs' , ifnull(json_length(a.imgs),0)
                    ) as user_action  
   from    contents a 
               left join content_like_users d on a.content_id = d.content_id and d.user_id  = ?
               left join content_scrap_users e on a.content_id = e.content_id and e.user_id  = ?
               left join arena.matches m on m.match_id = a.arena_id
               left join arena.competitions  cp on cp.comp_fa_id = m.comp_fa_id
               left join arena.teams lt on m.localteam_id = lt.team_fa_id
               left join arena.teams vt on m.visitorteam_id = vt.team_fa_id   
               left join arena.players p on a.player_id = p.player_id
                     left join  arena.teams pt on pt.team_fa_id = p.teamid
                     left join arena.teams tn        on tn.team_fa_id = p.national_teamid
               left join arena.teams t on a.team_id = t.team_id
        ,  user_info c 
   where a.content_id = ? 
   and   ifnull(a.deleted, 0) != 1
   and   a.user_id = c.user_id;
    ;
    `


    let parameter = [userid, userid, contentid];

    db.excuteSql(query, parameter,(err,result) =>{
         
        if ( err ) return res.status(400).json({result : 0, message :  err.message})
        
        return res.status(200).json(result[0]);
    } )    

};

exports.deleteConetent = (req,res) =>  {

    let id = req.params.id;
    let userid = req.user.userid;

    let query = 
    `
    update contents
       set deleted = 1
     where content_id = ?
       and user_id = ? ;    
    `
    let parameter = [id,userid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(500).json({result : 0, message :  err.message})
        }
        //success
        const affectedRows = result["affectedRows"]

        if ( affectedRows > 0) {
            return res.status(200).json({result : 1, message :  "success"})
        }

        return res.status(404).json({result : 0, message :  'nothing changed'})
    })
};


exports.postContent = (req,res) => {
    

    if (!req.body.title) { return res.status(400).json({result : 0, message :  "제목이 없습니다"}) }
    if (!req.body.boardid) { return res.status(400).json({result : 0, message :  "게시판 선택이 없습니다"}) }

    //user ip
    var ipAddress = (req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress).split(",")[0];

    // convert from "::ffff:192.0.0.1"  to "192.0.0.1"
        if (ipAddress.substr(0, 7) == "::ffff:") {
        ipAddress = ipAddress.substr(7)
        }

    var contentModel = {};

    contentModel.boardid = req.body.boardid;
    contentModel.userid = req.user.userid;
    contentModel.title = req.body.title;
    contentModel.arenaid = req.body.arenaid;
    contentModel.teamid = req.body.teamid;
    contentModel.playerid = req.body.playerid;
    contentModel.compid = req.body.compid;
    contentModel.preview = req.body.preview;
    contentModel.content = req.body.content;
    contentModel.ip = ipAddress;
    contentModel.tags = (req.body.tags ? req.body.tags : undefined);
    contentModel.imgs = (req.body.imgs ? req.body.imgs : undefined);
    contentModel.bodytype = req.body.bodytype;
    contentModel.celltype = req.body.celltype;
    contentModel.allowcomment = req.body.allowcomment; 
    contentModel.link = req.body.link;


    db.postContent( contentModel, (err, result) =>{
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        footballchat.add(contentModel)
        return res.status(201).json({result : 1, message : "created", data : result});
    })   

    // return sample 
    // {
    //     "result": 1,
    //     "message": "created",
    //     "content": {
    //         "boardid": "200",
    //         "userid": 5,
    //         "title": "I was born to England Manchester United hi Korean football fan",
    //         "preview": "today we glad to meet you ",
    //         "content": "Glad to me you\\n\\n",
    //         "ip": "127.0.0.1",
    //         "tags": "[]",
    //         "imgs": "[]",
    //         "allowcomment": "1",
    //         "contentid": 19029
    //     }
    // }
};


exports.updateContent = (req, res) => {


    if (!req.body.title) { return res.status(400).json({result : 0, message :  "제목이 없습니다"}) }
    if (!req.body.boardid) { return res.status(400).json({result : 0, message :  "게시판 선택이 없습니다"}) }
    

    let userid = req.user.userid;

    let contentid  = req.params.id;
    let title      = req.body.title;
    let preview    = req.body.preview;
    let content    = req.body.content;
    let boardid    = req.body.boardid;
    let arenaid    = req.body.arenaid;
    let teamid     = req.body.teamid;
    let compid     = req.body.compid;
    let playerid   = req.body.playerid;
    let tags       = (req.body.tags ? req.body.tags : undefined);
    let imgs       = (req.body.imgs ? req.body.imgs : undefined);
    let allowComment = (req.body.allowcomment ? req.body.allowcomment : 1); 
    let bodytype   = req.body.bodytype;
    let celltype   = req.body.celltype;
    let link       = req.body.link;


    let query =
    `
    update contents a
    set    a.title = ?
        ,  a.preview = ?
        ,  a.content = ?
        ,  a.board_id = ?
        ,  a.arena_id = ?
        ,  a.team_id = ?
        ,  a.player_id = ?
        ,  a.comp_id = ?
        ,  a.tags = ?
        ,  a.imgs = ?
        ,  a.allow_comment = ?
        ,  a.bodytype = ?
        ,  a.link = ?
     where a.content_id = ?
     and   a.user_id = ?
     and   a.deleted = 0;
    `

    //todo : 에디터에서 celltype이 제대로 안넘오옴 제대로 넘어올때 풀기 
    // let parameter = [title, preview, content, boardid, arenaid, tags, imgs, allowComment, bodytype, celltype, link, contentid, userid];
    let parameter = [title, preview, content, boardid, arenaid, teamid, playerid, compid, tags, imgs, allowComment, bodytype,  link, contentid, userid];

    db.excuteSql(query, parameter,(err,result) =>{
        
        if ( err ) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        let returnData = {}
        returnData.contentid = Number(contentid)

        return res.status(200).json({result : 1, message : "updated", data : returnData });
    } )
};


//todo usermodel 
exports.getHifivers = (req, res) => {
    let contentid = req.params.id;

    let query = 
    `
    select b.username
        ,  b.nickname
        ,  b.profile
        ,  b.avatar_url
     from content_like_users a
        , user_info b
    where a.user_id = b.user_id
      and a.content_id = ? ;
    `
    var parameter = [contentid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
            return res.status(200).send(result);
    })
};



exports.setHifive = (req,res) =>  {

    let contentid = req.params.id;
    let userid = req.user.userid;
    let userHifiveCount = req.body.cnt;

    if (!userHifiveCount) { userHifiveCount = 1 }

    let query1 = 
    `
    insert into content_like_users(content_id, user_id, count)
    values (? , ?, ?)
    ON DUPLICATE KEY UPDATE
    count = ifnull(count,0) + ?
    `
    ;

    let query2 = 
    `
    update contents
       set likers = ifnull(likers,0) + ?
     where content_id = ?;    
    `;

    let parameter1 = [contentid, userid, userHifiveCount, userHifiveCount];
    let parameter2 = [userHifiveCount, contentid];

    db.excuteTransactionSql(query1, parameter1, query2, parameter2, (err, result)=>{
        if (err) {
            //return res.status(500).json({error: 'server error : ' + err})
            return res.status(400).json( {result : 0, message : "하이파이브 등록 실패" + err.message})
        }
        notification.addHifiveNotification(contentid, userid)
        return res.status(200).json({result : 1, message : "하이파이브 등록 완료"})
    });
};

exports.setUnHifive = (req,res) =>  {

    let contentid = req.params.id
    let userid = req.user.userid
    

    let query1 = 
    `
    update contents a
    set a.likers = GREATEST(a.likers - ( select x.count
                                         from   content_like_users x
                                         where  x.content_id = ?
                                         and    x.user_id = ?
                                         limit 1 ), 0 )
    where a.content_id = ?
    `
    ;

    let query2 = 
    `
    delete from content_like_users
    where  content_id = ?
    and    user_id = ?;
    `;
    

    let parameter1 = [contentid, userid, contentid];
    let parameter2 = [contentid, userid];
    

    db.excuteTransactionSql(query1, parameter1, query2, parameter2, (err, result)=>{
        if (err) return res.status(400).json({result : 0, message : "하이파이브 취소 실패" + err.message});
        return res.status(200).json({result : 1, message : "하이파이브 취소 완료"});
    });
};

// scrap
exports.getScraps = (req, res) => {
    // let contentid = req.params.id;
    // let userid =req.body.userid

    // let query1 = 
    // `
    // update contents
    //    set scraps = scraps + 1
    //  where content_id = ?;    
    // `

    // let query2 = 
    // `
    // insert into content_scrap_users(content_id, user_id)
    //    values (? , ?)
    // `    
    // let parameter1 = [contentid];
    // let parameter2 = [contentid, userid];

    // db.excuteTransactionSql(query1, parameter1, query2, parameter2, (err, result)=>{
    //     if (err) {
    //         return res.status(500).json({error: 'server error'})
    //     }

    //     return res.status(200).send();
    // });
};

exports.postScrap = (req, res) => {

    let contentid = req.params.id
    let userid = req.user.userid

    let query1 = 
    `
    insert into content_scrap_users(content_id, user_id)
       values (? , ?)
    `  ;    

    let query2 = 
    `
    update contents
       set scraps = ifnull(scraps,0) + 1
     where content_id = ?;    
    `;

    let parameter1 = [contentid, userid];
    let parameter2 = [contentid];
   
    db.excuteTransactionSql(query1, parameter1, query2, parameter2, (err, result)=>{
        if (err) return res.status(400).json({result : 0, message : "스크랩 등록 실패" +  err.message})
        notification.addScrapNotification(contentid, userid)
        return res.status(200).json({result : 1, message : "스크랩 등록 완료"})
    });
};

exports.getScrapUsers = (req, res) => {
    let contentid = req.params.id;

    let query = 
    `
    select b.username
        ,  b.nickname
        ,  b.profile
        ,  b.avatar_url
     from content_scrap_users a
        , user_info b
    where a.user_id = b.user_id
      and a.content_id = ? ;
    `
    var parameter = [contentid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) {
            return res.status(400).json({result : 0, message :  err.message})
        }
        //success
            return res.status(200).send(result);
    })
};


exports.deleteScrap = (req, res) => {
    let contentid = req.params.id;
    let userid = req.user.userid;

    let query1 = 
    `
    delete from content_scrap_users
       where content_id = ?
         and user_id = ?;
    `    

    let query2 = 
    `
    update contents
       set scraps = scraps - 1
     where content_id = ?;    
    `
    let parameter1 = [contentid, userid];
    let parameter2 = [contentid];

    db.excuteTransactionSql(query1, parameter1, query2, parameter2, (err, result)=>{
        if (err) return res.status(400).json({result : 0, message : "스크랩 취소 실패" +  err.message})
        return res.status(200).json({result : 1, message : "스크랩 취소 완료"});
    });
};

// report
exports.setReported = (req, res) => {
    let contentid = req.params.id;

    var query = 
    `
    update contents
       set reported = 1
     where content_id = ?;
    `
    var parameter = [contentid];

    db.excuteSql(query, parameter, (err, result)=>{
        if (err) return res.status(500).json({error: 'server error'})

                //success
        const affectedRows = result["affectedRows"]

        if ( affectedRows > 0) {
            return res.status(200).json({result : 1, message :  "success"})
        }

        return res.status(404).json({result : 0, message :  err.message})
    })
};


//tags

//contentid의 태그로 가져오게끔 수정해야됨 잠이와서 나중에 ㅋ
exports.getRelationContents = ( req, res) => {
        
        let contentid = req.params.id
        let userid = (req.user?req.user.userid : undefined)
    
        let query = 
        `
        select a.content_id
                , a.title
                , a.arena_id
                , a.team_id
                , a.player_id
                , a.deleted
                , a.reported
                , a.comments
                , a.scraps
                , a.board_id
                , a.likers
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
            from contents a
                    ,boards b
                    ,user_info c 
            where a.board_id = b.board_id
                and a.user_id = c.user_id
                and ifnull(a.deleted, 0) != 1
                and a.content_id in
                                    (
                                select distinct content_id
                                from tagmap
                                where tag_id in (
                                            select a.id
                                            from tags a
                                                ,tagmap b
                                            where a.id = b.tag_id
                                            and content_id = ?
                                                    ) 
                                and content_id <> ?
										  union
                                          select b.content_id
                                          from contents a,
                                               contents b
                                        where a.content_id = ?
                                          and b.content_id <> ?
                                          and ((a.arena_id = b.arena_id and a.arena_id is not null)
                                           or  (a.player_id = b.player_id and a.player_id is not null) 
                                           or  (a.team_id = b.team_id and a.team_id is not null)
                                           )
                                    )
        order by content_id desc                                 
        limit 3;
        ;
        `
    
    
        let parameter = [contentid, contentid, contentid, contentid];
    
        db.excuteSql(query, parameter,(err,result) =>{
             
            if ( err ) return res.status(400).json({result : 0, message :  err.message})
            
            return res.status(200).json(result);
        } )    
    
    };


    exports.getRelationMatches = ( req, res) => {
        
        let contentid = req.params.id
    
        let query = 
        `
        select c.comp_id
            , b.match_id
            , b.match_fa_id 
            , b.season
            , DATE_FORMAT(b.match_date   ,'%Y-%m-%dT%T.000Z')  match_date
            , b.timer
            , b.status
            , json_object(
                "id"           , lt.team_id 
                ,"emblem_id"   , lt.team_fm_id 
                ,"name"        , ifnull(ifnull(lt.team_name_kor ,lt.team_short_name_kor ) , lt.team_name)     
            ) home_team
            , if(status='Pen.', concat(b.localteam_score,'(',b.penalty_local,')') ,b.localteam_score ) home_score
            , json_object(
                "id"           , vt.team_id 
                ,"emblem_id"   , vt.team_fm_id 
                ,"name"        , ifnull(ifnull(vt.team_name_kor ,vt.team_short_name_kor )  , vt.team_name)  
                ) away_team
            , if(status='Pen.', concat(b.visitorteam_score,'(',b.penalty_visitor,')') , b.visitorteam_score) away_score
        from hifive.contents a 
            join arena.matches b on json_contains(a.tags, CAST(concat('"M', b.match_id, '"') AS CHAR), '$')
            left join  arena.teams lt on lt.team_fa_id = b.localteam_id
            left join  arena.teams vt on vt.team_fa_id = b.visitorteam_id
            left join  arena.competitions c on b.comp_fa_id = c.comp_fa_id
        where a.content_id = ?		             
        order by b.match_date
        ;
        `
    
    
        let parameter = [contentid];
    
        db.excuteSql(query, parameter,(err,result) =>{
             
            if ( err ) return res.status(400).json({result : 0, message :  err.message})
            
            return res.status(200).json(result);
        } )    
    
    };


    exports.getPlayeRatings = ( req, res) => {
        
        let contentid = req.params.id
    
        let query = 
        `
        select json_object(
                            "id"               , p.player_id 
                            ,"soccerwiki_id"   , p.soccerwiki_id
                            ,"name"            , ifnull(ifnull(p.player_short_name_kor, p.player_name_kor), p.player_common_name)
                            ,"no"              , b.number 
                            ,"pos"             , b.pos
                            ,"team"        , json_object(
                                                        "id"           , t.team_id 
                                                        ,"emblem_id"   , t.team_fm_id
                                                        ,"name"        , ifnull(ifnull(t.team_name_kor ,t.team_short_name_kor ) , t.team_name)    
                                                    )
                            ,"startingyn", b.startingyn
                            ,"substitutions", b.substitutions
                            ,"subs_minute", b.subs_minute   
                            ,"stat" ,json_object(
                                                "g", JSON_UNQUOTE(player_stats->"$.goals") 
                                                , "yc",JSON_UNQUOTE(player_stats->"$.yellowcards") 
                                                , "rc",JSON_UNQUOTE(player_stats->"$.redcards")                                                       
                                                , "as" ,JSON_UNQUOTE(player_stats->"$.assists")  
                                        ) 
                ) player    
                ,r.hifive     
                ,r.rating
                ,r.comment
                ,r.time_seq
                ,r.updated
                from  arena.lineup b 
                left join arena.players p on b.player_fa_id = p.player_fa_id
                left join arena.teams t on b.team_fa_id = t.team_fa_id
                , arena_user_player_rating r
                , contents c        
                where b.match_id = r.match_id
                and b.player_id = r.player_id
                and r.user_id = c.user_id
                and b.match_id = c.arena_id
                and c.content_id = ?
                order by r.rating desc
        ;
        `
    
    
        let parameter = [contentid];
    
        db.excuteSql(query, parameter,(err,result) =>{
             
            if ( err ) return res.status(400).json({result : 0, message :  err.message})
            
            return res.status(200).json(result);
        } )    
    
    };    