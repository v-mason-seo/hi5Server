const express = require('express');
// const router = express.Router();
const router = require('express-promise-router')();

const settings = require('./settings.controller');

//게시판
router.get('/test', settings.test);
router.get('/pushtest', settings.pushtest);
//http://127.0.0.1:5300/v1/boards/200?limit=10&offset=2
router.get('/boards' ,  settings.getBoardList );

router.get('/notification_type' ,  settings.getNotificationType ); 
//router.get('/' ,  boards.getBoardALLContentList );

//http://127.0.0.1:5300/v1/boards/200


//todo5
// router.post('/', boards.createBoard); //게시판 생성
module.exports = router;