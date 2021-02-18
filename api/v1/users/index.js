const express = require('express');
const router = express.Router();
const auth = require('../../../services/auth');
const users = require('./users.controller');



// router.get('/', users.getUsers); 

//본인
router.post('/',auth.isAuthenticated, users.createUser);
router.get('/',auth.isAuthenticated, users.getLoginUser);
router.put('/',auth.isAuthenticated, users.updateLoginUser);
router.put('/avatar',auth.isAuthenticated, users.updateAvatar); 
router.delete('/',auth.isAuthenticated, users.deleteLoginUser);

//푸쉬용 디바이스 등록 삭제
router.get('/device', auth.isAuthenticated, users.hasRegisterDevice);
router.post('/device', auth.isAuthenticated, users.registerDevice);
router.delete('/device', auth.isAuthenticated, users.deRegisterDevice);
router.post('/callback', users.callback)
//푸쉬용 유저 구독


//다른사람꺼
router.get('/:username', users.getUser);
router.get('/:username/contents', users.getUserContentList);
router.get('/:username/comments', users.getUserCommentList);
router.get('/:username/hifive',auth.isAuthUserOrNot, users.getUserHifivedContentList);
/**
 * 다른사람이 스크랩한 것도 보여줘야 하나? => no
 */
router.get('/:username/scrap',auth.isAuthUserOrNot, users.getUserScrapContentList);




//// favorite team
// router.get(':/id/favorite/teams', users.getFavoriteTeamList);
// router.post(':/id/favorite/team', users.createFavoriteTeam);
// router.delete(':/id/favorite/team', users.deleteFavoriteTeam);

//// favorite player
router.get('/:username/favorite/players', users.getFavoritePlayerList);
router.post('/:username/favorite/player', auth.isAuthenticated, users.createFavoritePlayer);
// router.delete(':/id/favorite/player/:id', users.deleteFavoritePlayer);


module.exports = router;