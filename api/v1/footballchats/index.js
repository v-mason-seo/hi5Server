const express = require('express')
const router = express.Router()
const auth = require('../../../services/auth');
const footballchats = require('./footballchats.controller');

//게시판
//http://127.0.0.1:5300/v1/hfboards?limit=10&offset=2
/*

- 즐겨찾기 따로
- 리스트에서 유저가 안보고 싶은 건 빼고(다음 기능)

*/

router.get('/favorite' , auth.isAuthUserOrNot ,footballchats.getFootballChatList );

router.get('/list' , auth.isAuthUserOrNot ,footballchats.getFootballChatList );
module.exports = router;