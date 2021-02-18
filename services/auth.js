/**
 * auth.js
 */

'use strict';

const jwt = require('jsonwebtoken')
const expressjwt = require('express-jwt')
const randomWords = require('random-words')
const appconfig = require('../config/appconfig')

exports.config = {
    SECRET : 'nextKingNeymar'
    ,EXPIRES :  1296000
    ,REFRESH_SECRET : 'nex!tK#in#glegend'
    ,REFRESH_EXPIRES : 2628000
    ,AUDIENCE : "hifivefootball.com"
}


// JWT 토큰 생성 함수
function signToken(user) {
    return jwt.sign({userid: user.userid}, this.config.SECRET, { expiresIn: this.config.EXPIRES });
}

function signAccessToken(user) {
    return jwt.sign({userid: user.userid}, this.config.SECRET, { expiresIn: this.config.EXPIRES });
}

function signRefreshToken(user) {
    let randomeWord =  randomWords()
    return jwt.sign({userid: user.userid , username : randomeWord, audience : this.config.AUDIENCE}, this.config.REFRESH_SECRET, { expiresIn: this.config.REFRESH_EXPIRES });
    // return jwt.sign({userid: user.userid , audience : this.config.AUDIENCE}, this.config.REFRESH_SECRET, { expiresIn: this.config.REFRESH_EXPIRES });    
}

function verifyRefreshToken(token){
    
    return jwt.verify(token, this.config.REFRESH_SECRET)

}
const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization;
    
    // // 토큰 인증 로직
    // validateJwt(req, res, next);
    // req.headers.authorization = 'Bearer ' + token;
    
    expressjwt({secret: this.config.SECRET})(req, res, function() {
        if ( !req.user) return res.status(401).json({result : 0, message : "로그인 필요"});
        next();
    });
}

const isAuthUserOrNot = (req, res, next) => {

    if (!req.headers.authorization) return next();
    
    const token = req.headers.authorization;
    // req.headers.authorization = 'Bearer ' + token;
    
    expressjwt({secret: this.config.SECRET})(req, res, function() {
        next();
    });
}

exports.verifyRefreshToken = verifyRefreshToken;
exports.signToken = signToken;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.isAuthenticated = isAuthenticated;
exports.isAuthUserOrNot = isAuthUserOrNot;