const db = require('../services/mysqlservice')

//
// create table user_blocks(
// 	user_id int(11),
//     reason int(2),
//     block_from datetime,
//     block_to datetime,
//     created datetime
// )

exports.setBlockUser = (userid, minute) => {
    return new Promise((resolve, reject) => {
        // resolve(username)
        if (userid === undefined) return resolve(false)
        if (minute === undefined) return resolve(false) //check int

        // if (reason === undefined) //1 default
        // if (blockFrom === undefined) //now

        let query = 'insert user_blocks(user_id, reason, block_from, block_to) values (?, 1, now(), DATE_ADD(now(), INTERVAL ? Minute));'

        db.excuteSql(query,[], (err, results) => {
            if (err) {
                reject(new Error('유저 블록을 못했습니다'))
            }
            if (results.affectedRows == 0) resolve(false)

            resolve(true)
        })
    })
}

exports.isBlockUser = (userid) => {
    return new Promise((resolve, reject) => {
        db.excuteSql('select count(1) as is_block from user_blocks where user_id = ? and now() between block_from and block_to',[userid], (err, results) => {
            if (err) {
                reject(new Error('Request is failed'))
            }

            if (results[0].is_block === 0 ) resolve(false)
            resolve(true)
        })
    })
}

exports.isBlockUser2 = (username) => {
    return new Promise((resolve, reject) => {
        
        // resolve(username) <-- 됨
        // return reject(new Error('Request is failed')) <-- 안딤

        //됨
        // setTimeout((function() {
        //  reject(new Error('Request is failed'))
        // }));


        db.excuteSql('select 1 from ',[], (err, result) => {
            if (err) {
                reject(new Error('Request is failed'))
            }
            resolve(result)
        })
    })
}