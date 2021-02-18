
var db = require('../../../services/mysqlservice');
var async = require('async')




exports.getContainTagContent = ( req, res) => {
    
        let tag = req.params.tag;
        let offset = req.query.offset;
        let limit = req.query.limit ;
        let boardid = req.params.id;
        let userid = (req.user?req.user.userid : undefined)
    
    
        if (!offset) {
            offset = 0
            // return res.status(400).json({error: 'Incorrect offset'});
        }
    
        if (!limit) {
            limit = 15
            // return res.status(400).json({error: 'Incorrect limit'});
        }
    
        if (!boardid) {
            return res.status(400).json({error: 'Incorrect boardid'});
        }

        let query = 
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
                      ,'scrap', if(e.user_id  ,1,0)
                      ,'hasImgs' , ifnull(json_length(a.imgs),0)
                    ) as user_action                        
    from contents a
                left join content_like_users d on a.content_id = d.content_id and d.user_id  = ?
                left join content_scrap_users e on a.content_id = e.content_id and e.user_id  = ?
            ,boards b
            ,user_info c 
    where a.board_id = b.board_id
        and a.user_id = c.user_id
        and ifnull(a.deleted, 0) != 1
        and a.board_id = ?
        and a.content_id in
        (
        select distinct content_id
          from tagmap 
         where tag_id in 
                        (select id
                           from tags
                          where name = ?
                        )
        )        
    order by content_id desc
    limit ?
    offset ? 

        ;
        `
    
    
        let parameter = [userid, userid, boardid, tag, limit , offset]

        db.excuteSql(query, parameter,(err,result) =>{
             
            if ( err ) return res.status(400).json({result : 0, message :  err.message})
            
            return res.status(200).json(result[0]);
        } )    
    
    };