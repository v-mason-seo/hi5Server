const db = require("../../../services/mysqlservice");

exports.getFootballChatList = (req, res) => {
  let offset = req.query.offset ? req.query.offset : 0;
  let limit = req.query.limit ? req.query.limit : 10;

  let query = `
  select fc.mention_type
        ,  fc.mention_id
        ,  if(fc.mention_type = 'P',
            json_object(
                        "id", p.player_id
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
                                ),
                null) player
            ,if(fc.mention_type = 'T' , 
                json_object(
                            "name", ifnull(ifnull(t.team_short_name_kor ,t.team_short_name )  , t.team_name)
                            ,"id" , t.team_id             
                            ,"emblem_id", t.team_fm_id  
                            ),
                null) team
            ,if(fc.mention_type = 'M' , 
                json_object(
                            "comp",json_object(
                                "id" , cp.comp_id
                                ,"nm", ifnull(cp.comp_name_kor, cp.comp_name) 
                                ,"comp_image_id", cp.comp_fm_id
                            )                 
                            ,"match_id", m.match_id
                            ,"match_date", DATE_FORMAT(m.match_date_utc   ,'%Y-%m-%dT%T.000Z')           
                            ,"home_team" ,json_object(
                                                    "id"           , lt.team_id 
                                                    ,"emblem_id"   , lt.team_fm_id 
                                                    ,"name"        , ifnull(ifnull(lt.team_short_name_kor ,lt.team_short_name ) , lt.team_name)
                                                )                                                                                                 
                            ,"away_team",json_object(
                                                    "id"           , vt.team_id 
                                                    ,"emblem_id"   , vt.team_fm_id 
                                                    ,"name"        , ifnull(ifnull(vt.team_short_name_kor ,vt.team_short_name )  , vt.team_name)  
                                                    )	
                            ,"home_score" , if(m.status='Pen.', concat(m.localteam_score,'(',m.penalty_local,')') , m.localteam_score)
                            ,"away_score" , if(m.status='Pen.', concat(m.visitorteam_score,'(',m.penalty_visitor,')') , m.visitorteam_score)
                            ,"status"     , m.status
                            ,"season"     , m.season
                            ,"week"       , m.week                                                                  									                
                        ),
            null) as 'match'
            ,if(fc.mention_type = 'B' ,
                json_object(
                        "board_id", fc.mention_id
                        ,"title" , b.title
                        ,"subtitle", b.subtitle
                    ),
                null) as board
             ,if(fc.mention_type = 'C' ,
                json_object(
                        "id" ,comp.comp_id
                        ,"nm", ifnull(comp.comp_name_kor, comp.comp_name)
                        ,"comp_image_id", comp.comp_fm_id
                ),
            null) as comp
            ,fc.cnt 
        ,c.title 
        ,c.content_id
        ,c.updated
        from hifive.footballchats fc
        left join hifive.boards b on fc.mention_type = 'B' and fc.mention_id = b.board_id
        left join arena.competitions comp on fc.mention_type = 'C' and fc.mention_id = comp.comp_id
        left join arena.players p on fc.mention_type ='P' and fc.mention_id = p.player_id
        left join  arena.teams pt on pt.team_fa_id = p.teamid
        left join arena.teams tn        on tn.team_fa_id = p.national_teamid
        left join arena.teams t on fc.mention_type ='T' and fc.mention_id = t.team_id
        left join arena.matches m on fc.mention_type ='M' and fc.mention_id = m.match_id
            left join arena.competitions  cp on cp.comp_fa_id = m.comp_fa_id
            left join arena.teams lt on m.localteam_id = lt.team_fa_id
            left join arena.teams vt on m.visitorteam_id = vt.team_fa_id  
                ,hifive.contents c
        where fc.content_id = c.content_id
            and fc.content_id is  not null            
        order by fc.content_id desc
        limit ?
        offset ?
        ;`;

  let parameter = [limit, offset];

  db.excuteSql(query, parameter, function(err, result) {
    if (err) {
      return res.status(400).json({ result: 0, message: err.message });
    }
    //success
    return res.status(200).json(result);
  });
};
