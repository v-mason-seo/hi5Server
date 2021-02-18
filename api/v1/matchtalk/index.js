const express = require('express')
const router = express.Router()
const matchTalk = require('./matchtalk.controller');

var auth = require('../../../services/auth');


//matchTalk
router.get('/', auth.isAuthUserOrNot, matchTalk.getTalks);
router.post('/', auth.isAuthenticated,  matchTalk.createTalk);

router.get('/best', auth.isAuthUserOrNot, matchTalk.getMatchScreenTalks);

router.get('/:id', auth.isAuthUserOrNot, matchTalk.getTalk); //<-- 튜토리얼에 rest에서 :id <-- Talk key로 정의되가지고
router.delete('/:id', auth.isAuthenticated, matchTalk.deleteTalk);
// router.put('/:id', auth.isAuthenticated, matchTalk.updateTalk); //내맽은말은 돌릴수 없다!!!!



// //신고
//todo
//router.post('/:id/report', matchTalk.reportTalk); //신고
router.put('/:id/reported', auth.isAuthenticated, matchTalk.reported); //신고후 블락처리


// //hifive

router.put('/:id/hifive', auth.isAuthenticated, matchTalk.setHifive);  // todo : change post
// router.put('/:id/unhifive', auth.isAuthenticated, matchTalk.setUnHifive);
// router.get('/:id/hifiveduser', matchTalk.getHifivedUsers);



module.exports = router;