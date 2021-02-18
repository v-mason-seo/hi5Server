const express = require('express')
const router = express.Router()
const auth = require('../../../services/auth');
const boards = require('./boards.controller');

//게시판

//http://127.0.0.1:5300/v1/boards/200?limit=10&offset=2

//todo boardtype 에 따라 보이는거 issue, 안보이도록 수정해야됨
router.get('/' , auth.isAuthUserOrNot ,boards.getBoardALLContentList );
//router.get('/' ,  boards.getBoardALLContentList );

//http://127.0.0.1:5300/v1/boards/200
router.get('/:id',auth.isAuthUserOrNot ,boards.getBoardContentList);
router.get('/:id/existnew' ,boards.getIsExistNewContents);
//http://127.0.0.1:5300/v1/boards/700/issue?closed=1
router.get('/:id/issue',auth.isAuthUserOrNot ,boards.getIssueBoardContentList);
router.get('/:id/best', auth.isAuthUserOrNot, boards.getBestBoards);
// router.get('/', auth.isAuthUserOrNot, bests.getBests);


module.exports = router;