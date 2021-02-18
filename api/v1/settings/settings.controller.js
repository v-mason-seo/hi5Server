
const db = require('../../../services/mysqlservice');
const userblock = require('../../../services/userblock')
const pushservice = require('../../../services/pushservice')

exports.test = async (req, res) => {
    
        await userblock.isBlockUser(851)
        .then(isBlockUserResult => {
            console.log(isBlockUserResult)
    
            // let error = new Error('Default Error')
            // error.code = 300
            // throw error
    
            return res.status(200).json(isBlockUserResult)
        })   
        // .catch(err => {
        //     console.log('dddd')
        //     return res.status(400).json({result:isBlockUserResult})
        // })

    
    // .catch(next)
    // return res.status(200).json({result:'ok'})
}

exports.pushtest = (req, res) => {
    pushservice.sendNotification(2466)
}

exports.getBoardList = (req,res) => {
    let useyn = req.query.useyn ? req.query.useyn : 1

    let query = 
    `
    select a.board_id
         , a.title
         , a.subtitle
         , a.short_name
         , a.type_gb
         , a.group
         , b.codename group_name
         , a.img_url
         , a.has_best
         , a.has_instance_text
         , a.instance_text
         , a.use_yn
      from boards a
           left join common_info b on a.group = b.small_code and b.large_code = 'B100' and midium_code = 'B100'
     where a.use_yn = ?
     order by sort;
    `;


    db.excuteSql(query, [useyn], function (err, result){
        if (err) {
            return res.status(400).json({error: '*Query error - ' + err});
        }
        //success
        return res.status(200).json(result);
    }); 
};

exports.getCommonInfoList = (req,res) => {
    
    let large_code = req.query.large_code ? req.query.large_code : undefined
    let midium_code = req.query.midium_code ? req.query.midium_code : undefined

    let query = 
    `
    select a.large_code
        ,  a.midium_code
        ,  a.small_code
        ,  a.codename
        ,  a.value1
        ,  a.value2
        ,  a.value3
        ,  a.value4
        ,  a.value5
        ,  a.remark
        ,  a.created
    from   common_info a
    where  large_code = ?
    and    midium_code = ?
    and    ifnull(deleteyn, 'N') = 'N'
    order by sort_seq
    ;
    `;


    db.excuteSql(query, [large_code, midium_code], function (err, result){
        if (err) {
            return res.status(400).json({error: '*Query error - ' + err});
        }
        //success
        return res.status(200).json(result);
    }); 
};

exports.getNotificationType = (req,res) => {
    let useyn = req.query.useyn ? req.query.useyn : 1

    let query = 
    `
    select a.notification_type_id
        ,  a.notification_name
        ,  a.description
    from   notification_type a
    order by a.notification_type_id;
    `;


    db.excuteSql(query, [useyn], function (err, result){
        if (err) {
            return res.status(400).json({error: 'getNotificationType query error - ' + err});
        }
        //success
        return res.status(200).json(result);
    }); 
};



