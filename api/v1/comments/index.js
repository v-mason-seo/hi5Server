const express = require('express')
const router = express.Router()
const comments = require('./comments.controller');

var auth = require('../../../services/auth');

//comments
router.get('/', auth.isAuthUserOrNot, comments.getComments);
router.post('/', auth.isAuthenticated,  comments.createComment);

router.get('/best', auth.isAuthUserOrNot, comments.getBestComments);

router.get('/:id', auth.isAuthUserOrNot, comments.getComment); //<-- 튜토리얼에 rest에서 :id <-- comment key로 정의되가지고
router.delete('/:id', auth.isAuthenticated, comments.deleteComment);
router.put('/:id', auth.isAuthenticated, comments.updateComment);
router.get('/:id/group', auth.isAuthUserOrNot, comments.getGroupComments); //http://127.0.0.1:5300/v1/comments/428/group


// //신고
//todo
//router.post('/:id/report', comments.reportComment); //신고
router.put('/:id/reported', auth.isAuthenticated, comments.reported); //신고후 블락처리


// hifive
router.put('/:id/hifive', auth.isAuthenticated, comments.setHifive);  // todo : change post
router.put('/:id/unhifive', auth.isAuthenticated, comments.setUnHifive);
router.get('/:id/hifiveduser', comments.getHifivedUsers);



module.exports = router;