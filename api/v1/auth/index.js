const express = require('express');
const router = express.Router();

const auths = require('./auth.controller');

var auth = require('../../../services/auth');

router.get('/login/loginpage', auths.loginpage);
//// login logout
router.post('/login', auths.login);
// router.post('/singup', auths.singUp);
router.post('/login/social', auths.socialLogin);
router.post('/signup/social', auths.socialSignup);




router.get('/login', auths.loginHTML);


// router.get('/na', auths.na);
// router.get('/na2', authx.isAuthenticated, auths.na2);
// router.get('/na3', auth.isAuthenticated, auths.na3);

router.get('/login/kakao', auths.loginKakao);
router.get('/login/kakao/callback', auths.loginKakaoCallback);


router.get('/login/naver', auths.loginNaver);
router.get('/login/naver/callback', auths.loginNaverCallback);

router.get('/logout', auths.logout);

router.post('/token/refresh', auths.accessTokenRefresh);
// router.get('/token/refresh/refresh', auths.refreshTokenRefresh);

//127.0.0.1:5300/V1/auth/valid/email?q=yunchiri@naver.com
router.get('/valid/email', auths.checkEmailExist)

//127.0.0.1:5300/V1/auth/valid/email?q=ronaldo
router.get('/valid/username', auths.checkUserNameExist)

module.exports = router;