'use strict'

var db = require('../../../services/mysqlservice')
var cmd = require('../../../config/commands')
var auth = require('../../../services/auth')

var passport = require('passport')
var async = require('async')
var request = require('request')
var validator = require('validator');

// require('../../../config/passport').setup()


require('./passport').setup()


exports.loginHTML = ( req, res, next ) => {
    res.status(200).send('<h1>회원가입</h1><form action="/login/join" method="POST" enctype="multipart/form-data"><input name="user_id" /><input name="password" /><input type="submit" /></form>' +
    '<br /><br /><br /><br /><br />' +
    '<h1>로그인</h1><form action="/v1/auth/login" method="POST"><input name="userid" /><input name="password" /><input type="submit" /></form>' +
    '<br /><br /><br /><br /><br />' +
    '<a href="/login/oauth/facebook">페이스북 로그인</a><br />' +
    '<a href="/login/oauth/twitter">트위터 로그인</a><br />' +
    '<a href="/login/oauth/google">구글플러스 로그인</a><br />' +
    '<a href="/login/oauth/kakao">카카오톡 로그인</a><br />' +
    '<a href="/login/oauth/naver">네이버 로그인</a><br />')
}

exports.loginpage = ( req, res, next ) => {
    res.status(200).send(
        `
        <!-- 아래는 예시 -->
        <div>
            <div class="row">
                <div class="col-md-offset-1 col-md-5">
                    <a href="/auth/facebook">
                        <img src="/public/auth/assets/img/icons/facebook.png"/>
                    </a>
                    <a href="/auth/twitter">
                        <img src="/public/auth/assets/img/icons/twitter.png"/>
                    </a>
        
                    <!-- kakao login -->
                    <a href="/v1/auth/login/kakao">
                        <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"/>
                    </a>
                    <!-- naver login -->
                    <a href="/v1/auth/login/naver"> 
                            <img src="/static/auth/naver.PNG"/>
                    </a>                    
                </div>
            </div>
            <div class="col-md-6">
                <div ui-view></div>
            </div>
        
        </div>`
    )
}


function getTokens(user, callback){

    let refreshToken = auth.signRefreshToken(user)
    let accessToken = auth.signAccessToken(user)

    let query = 'update user_login set refresh_token = ? where user_id = ?'
    var parameter = [refreshToken, user.userid]

    let query2 = 'update user_info set logined = now() where user_id = ?'
    var parameter2 = [user.userid]
    
    //exports.excuteTransactionSql = function( query1, parameter1, query2, parameter2,  callback){

    db.excuteTransactionSql(query, parameter, query2, parameter2, function (err, result){
        if (err) {
            return callback(err, null)
        }
        
        if (result.affectedRows == 0) {
            return callback("Insert Fail", null)
        }

       var authModel = {}
       authModel.access_token = accessToken
       authModel.refresh_token = refreshToken
       authModel.expires_in = auth.config.EXPIRES
       authModel.token_type = "bearer"
        
       return callback(null, authModel)
    })

    /*//if ok 
    db.excuteSql(query, parameter, function (err, result){
        if (err) {
            return callback(err, null)
        }
        
        if (result.affectedRows == 0) {
            return callback("Insert Fail", null)
        }

        var authModel = {}
        authModel.access_token = accessToken
        authModel.refresh_token = refreshToken
        authModel.expires_in = auth.config.EXPIRES
        authModel.token_type = "bearer"
        
        return callback(null, authModel)
    })*/
}


exports.signup = (req, res, next ) => {
    //가입 여부 다시 체크

    //디비 저장

    // 완료보냄
}

exports.socialSignup = (req, res, next ) => {

    //null check 
    if (req.body.access_token == undefined || validator.isEmpty(req.body.access_token)) {
        return res.status(400).json({result : 0, message : "소셜로그인 권한이 없습니다"})
    }

    if (req.body.username == undefined || validator.isEmpty(req.body.username)) {
        return res.status(400).json({result : 0, message : "아이디가 없습니다"})
    }

    if (req.body.nickname == undefined || validator.isEmpty(req.body.nickname)) {
        return res.status(400).json({result : 0, message : "닉네임이 없습니다"})
    }
    
    if (req.body.email == undefined  || validator.isEmpty(req.body.email)) {
        return res.status(400).json({result : 0, message : "이메일이 없습니다"})
    }    

    //validator check 
    if (validator.isAscii(req.body.username) == false || validator.isLength(req.body.username,4,undefined) == false){
        return res.status(400).json({result : 0, message : "아이디 형식이 잘못되었습니다, 영어,숫자 4자리이상입니다"})
    }    

    if (validator.isEmail(req.body.email) == false ){
        return res.status(400).json({result : 0, message : "이메일이 형식이 잘못되었습니다"})
    }



    async.parallel([
        function(callback){
            if (req.body.provider != "kakao") return callback(null)
            var options = {
                url: 'https://kapi.kakao.com/v1/user/access_token_info',
                headers: {
                    'Authorization': req.body.access_token
                }
            }

            request(options, function (err, response, body) {
                if (err) return callback(err,null)

                if (response.statusCode != 200 ){
                    let responseBody = JSON.parse(body)
                    return callback(responseBody.msg,null)                    
                }

                let response_provider_user_id = JSON.parse(body).id
                //유저 아이디 한번더 비교
                if (req.body.provider_user_id == response_provider_user_id) {
                    return callback(null,'success')
                }else{
                    return callback('not matched user_id',null)
                }
            })
        },
        function(callback){
            if (req.body.provider != "naver") return callback(null)

            var options = {
                url: 'https://openapi.naver.com/v1/nid/verify',
                headers: {
                    //'Authorization': req.body.access_token
                    'authorization': req.body.access_token
                }
            }

            request(options, function (err, response, body) {
                if (err) return callback(err,null)   

                //console.log('error:', err); // Print the error if one occurred
                //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                //console.log('body:', body); // Print the HTML for the Google homepage.

                let responseBody = JSON.parse(body)

                if (response.statusCode != 200 ){
                    return callback(responseBody.message,null)                    
                }

                //유저 아이디 한번더 비교- 네이버는 그런거 없음 ㅅㅂ
                return callback(null,'success')
                
            })            
        }
    ],function(err, result){
        if (err) return res.status(401).json({result : 0, message : err})

        // 가입여부 다시 체크
        passport.authenticate('local-social-signup', {
            successRedirect : '/',
            failureRedirect : '/v1/auth/login'
            // failureFlash : true ,
            // successFlash : "Welcome!"
        },
        //가입여부 체크 
        function(err, user, info){

            let error = err|| info 
            if (error) return res.status(401).json({result : 0, message : error})
            if (!user)  return res.status(404).json({result : 0, message : info})

            // var token = auth.signToken(user.userid)
            
            // var authModel = {}
            // let refreshToken = auth.signRefreshToken(user.userid)
            // let accessToken = auth.signAccessToken(user.userid)
            // authModel.access_token = accessToken
            // authModel.refresh_token = refreshToken
            // authModel.expires_in = auth.config.EXPIRES
            // authModel.token_type = "bearer"

            //return res.status(200).json(authModel)

            getTokens(user, function(err,authModel){

                if (err) {
                    return res.status(404).json({result : 0, message : err})
                }

                return res.status(200).json({result : 1, message : "success", data : authModel})
            })

        })(req, res, next)        
    });      


}

exports.socialLogin = ( req, res, next ) => {
    if (req.body.access_token == undefined) {
        return res.status(404).json({result : 0, message : "need Auth"})
    }
    //check access token is valid
    

    async.parallel([
        function(callback){
            if (req.body.provider != "kakao") return callback(null)
            var options = {
                url: 'https://kapi.kakao.com/v1/user/access_token_info',
                headers: {
                    'Authorization': req.body.access_token
                }
            }

            request(options, function (err, response, body) {
                if (err) return callback(err,null)

                if (response.statusCode != 200 ){
                    let responseBody = JSON.parse(body)
                    return callback(responseBody.msg,null)                    
                }

                let response_provider_user_id = JSON.parse(body).id
                //유저 아이디 한번더 비교
                if (req.body.provider_user_id == response_provider_user_id) {
                    return callback(null,'success')
                }else{
                    return callback('not matched user_id',null)
                }
            })
        },
        function(callback){
            if (req.body.provider != "naver") return callback(null)

            var options = {
                url: 'https://openapi.naver.com/v1/nid/verify',
                headers: {
                    'Authorization': req.body.access_token
                }
            }

            request(options, function (err, response, body) {
                if (err) return callback(err,null)   

                // console.log('error:', err); // Print the error if one occurred
                // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                // console.log('body:', body); // Print the HTML for the Google homepage.

                let responseBody = JSON.parse(body)

                if (response.statusCode != 200 ){
                    return callback(responseBody.message,null)                    
                }

                //유저 아이디 한번더 비교- 네이버는 그런거 없음 ㅅㅂ
                return callback(null,'success')
                
            })            
        }
    ],function(err, result){
        if (err) return res.status(401).json({result : 0, message : err})

        passport.authenticate('local-social', {
            successRedirect : '/',
            failureRedirect : '/v1/auth/login'
            // failureFlash : true ,
            // successFlash : "Welcome!"
        },
         function(err, user, info){
            let error = err|| info 
            if (error) return res.status(401).json({result : 0, message : error})
            if (!user)  return res.status(404).json({result : 0, message : info})
            
            getTokens(user, function(err,authModel){
                if (err) {
                    return res.status(404).json({result : 0, message : err})
                }
                return res.status(200).json({result : 1, message : "success", data : authModel})
            })
        })(req, res, next)      
    });  
}

exports.login = ( req, res, next ) => {
    passport.authenticate('local', {
        successRedirect : '/',
        failureRedirect : '/v1/auth/login'
        // failureFlash : true ,
        // successFlash : "Welcome!"
    },
     function(err, user, info){
        let error = err|| info 
        if (error) return res.status(401).json({result : 0, message : error})
        if (!user) return res.status(404).json({result : 0, message : info})
        
        getTokens(user, function(err,authModel){
            if (err) {
                return res.status(404).json({result : 0, message : err})
            }
            return res.status(200).json({result : 1, message : "success", data : authModel})
        })
        
    })(req, res, next)    
}




exports.loginKakao = ( req, res, next ) => {
    passport.authenticate('kakao')(req, res, next)
}

exports.loginKakaoCallback = ( req, res ,next ) => {
    passport.authenticate('kakao',{
        failureRedirect : '/v1/auth/login/kakao/'
    })(req, res, next)
}


exports.loginNaver = ( req, res ,next) => {
    passport.authenticate('naver',null)(req, res,next)
}

exports.loginNaverCallback = ( req, res,next ) => {
    
    passport.authenticate('naver', {
        failureRedirect : '/v1/auth/login/naver/'
    },
    function(err, user, info){
       let error = err|| info 
       if (error) return res.status(401).json({result : 0, message : error})
       if (!user) return res.status(404).json({result : 0, message : info})

       getTokens(user, function(err,authModel){
        if (err) {
            res.status(404).json({result : 0, message : err})
        }
        return res.status(200).json({result : 1, message : "success", data : authModel})
    })

   })(req, res, next)      
}



exports.logout = ( req, res ) => {

    //delete userid's refresh token delete
    req.logout()
    res.redirect('/')    
}


exports.accessTokenRefresh = (req, res,next )  => {

    //check refreshToken is valide
    passport.authenticate('jwt',
        function(err, user, info){
        let error = err|| info 
        if (error) return res.status(401).json({result : 0, message : error})
        if (!user) return res.status(404).json({result : 0, message : info})
        
        let accessToken = auth.signAccessToken(user)

        var authModel = {}
        authModel.access_token = accessToken
        authModel.expires_in = auth.config.EXPIRES
        authModel.token_type = "bearer"
        return res.status(200).json({result : 1, message : "success", data : authModel})


    })(req, res, next)   
}


exports.checkEmailExist = (req, res) => {
    
    let email = req.query.q

    if (email == undefined  || validator.isEmpty(email)) {
        return res.status(400).json({result : 0, message : "이메일이 없습니다"})
    }    

    if (validator.isEmail(email) == false ){
        return res.status(400).json({result : 0, message : "이메일이 형식이 잘못되었습니다"})
    }

    let sql =
    `
    select count(1) as exist
    from user_login
    where email =  ?;
    `

    let parameter = [email];

    db.excuteSql(sql, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message : "이메일이 존재합니다"});
        }
        //success
        return res.status(200).json({result : result[0].exist, message : "이메일을 사용할수 있습니다"});
    })
}

exports.checkUserNameExist = (req,res) => {
    
    let username = req.query.q

    if (username == undefined || validator.isEmpty(username)) {
        return res.status(400).json({result : 0, message : "아이디가 없습니다"})
    }

    //validator check 
    if (validator.isAscii(username) == false || validator.isLength(username,4,undefined) == false ){
        return res.status(400).json({result : 0, message : "아이디 형식이 잘못되었습니다, 영어,숫자 4자리이상입니다"})
    }    

    let sql =
    `
    select count(1) as exist
    from user_info
    where username =  ?;
    `

    let parameter = [username];

    db.excuteSql(sql, parameter, function (err, result){
        if (err) {
            return res.status(400).json({result : 0, message : "아이디가 존재합니다"});
        }
        //success
        return res.status(200).json({result : result[0].exist, message : "아이디를 사용할수 있습니다"});
    })
}