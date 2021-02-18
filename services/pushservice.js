const request = require('request')
const axios = require('axios')
const db = require('../services/mysqlservice')
const queryString = require('querystring')


const kakaoPushReq = axios.create({
    baseURL : 'https://kapi.kakao.com',
    timeout : 2500,
    headers : {'Authorization': 'KakaoAK 7ea432af59da4da32bb0840a9f506d80'
              ,'Content-Type':'application/x-www-form-urlencoded'}
})

//https://developers.kakao.com/docs/restapi/tool
//https://developers.kakao.com/docs/restapi/push-notification#%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%EC%A0%84%EC%97%90-%ED%91%B8%EC%8B%9C-%EC%95%8C%EB%A6%BC-%EB%B3%B4%EB%82%B4%EA%B8%B0-%EA%B0%9C%EC%9A%94

exports.sendNotification = (notificationId) => {
    //uuids = ["1","2"]
    //get notification info
    getNotification(notificationId, (err, results) => {

        if (err) return
        if (results.length === 0) return

        for (const result of results) {

                        //result count 
            let message = {}
            message.push_alert = true
            message.message = result.msg
            message.target = {}
            message.target = result

            let messageBody = {}
            messageBody.for_apns = {}
            messageBody.for_apns = message

            let receivers = [result.receiver_id.toString()]
            let uuids = JSON.stringify(receivers)
            let pushMessage = JSON.stringify(messageBody)

            kakaoPushReq.post('/v1/push/send',
            queryString.stringify({
              uuids: uuids,
              push_message: pushMessage
            }))      
            .then(function (response) {
              console.log(response);
            })
            .catch(function (error) {
              console.log(error);
            });               
        }
    })

}

function makePushMsgJson(){
    let message = {}
    message.push_alert = true
    message.category = "category"
    message.content = "메세지"
    message.target = {}
    message.target.content_id = 1
    return message
}

function makeGcmMessage(){

}

function getNotification(notificationId, callback) {
    
    let query = 
    `
    select n.notification_id
         , n.receiver_id
         , ud.device_id
         , concat( u.nickname, nt.description,": ", json_extract(n.target, '$.ment'),'') as msg
         , n.confirm        
         , n.target
         , n.created
      from notification n
         , notification_type nt
         , user_info u
         , user_devices ud
     where n.sender_id = u.user_id 
       and n.receiver_id = ud.user_id
       and n.notification_type_id = nt.notification_type_id
       and n.notification_id = ?
    `

    db.excuteSql(query, [notificationId], (err, result)=>{
        if (err) return callback(err, null)

        return callback(null, result)
    })
}

exports.register = (deviceInfo, callback) => {
    //check already exist

    kakaoPushReq.post('/v1/push/register', 
        queryString.stringify({
            uuid: deviceInfo.uuid,
            device_id: deviceInfo.deviceId,
            push_type: deviceInfo.pushType,
            push_token: deviceInfo.pushToken
        }))
        .then(function (response) {
            if (response.status != 200) return callback('등록 오류', null)
            insertUserDevice(deviceInfo, (err, result) => {
                if (err) return callback(err, null)
                
                return callback(null, result)
            })
            console.log(response);
            
        })
        .catch(function (error) {
            console.log(error);
            return callback(error, null)
        });
}

exports.deRegister = (deviceInfo, callback) => {
    kakaoPushReq.post('/v1/push/deregister', 
        queryString.stringify({
            uuid: deviceInfo.uuid,
            device_id: deviceInfo.deviceId,
            push_type: deviceInfo.pushType
        }))
        .then(function (response) {
            if (response.status != 200) return callback('삭제 오류', null)

            deleteUserDevice(deviceInfo, (err, result) => {
                if (err) return callback(err, null)
        
                return callback(null, result)
            })
        })
        .catch(function (error) {
            console.log(error);
            return callback(error, null)
        });
}

exports.hasTokens = (deviceInfo, callback) => {
    kakaoPushReq.post('/v1/push/tokens', 
        queryString.stringify({
            uuid: deviceInfo.uuid,
            device_id: deviceInfo.deviceId,
            push_type: deviceInfo.pushType
        }))
        .then(function (response) {
            console.log(response);
            return callback(null, response)
        })
        .catch(function (error) {
            console.log(error);
            return callback(error, null)
        });
}

function insertUserDevice(deviceInfo, callback){
    let query = 
    `replace into hifive.user_devices(user_id, device_id, push_type, push_token)
             values(?, ?, ?, ?)
    `

    db.excuteSql(query, [deviceInfo.uuid, deviceInfo.deviceId, deviceInfo.pushType, deviceInfo.pushToken], (err, result)=>{
        if (err) return callback(err, null)

        return callback(null, result)
    })
}

function deleteUserDevice(deviceInfo, callback){
    let query = 'delete from hifive.user_devices where user_id = ? and device_id = ?'

    db.excuteSql(query, [deviceInfo.uuid, deviceInfo.deviceId], (err, result)=>{
        if (err) return callback(err, null)

        return callback(null, result)
    })    
}