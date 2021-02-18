//conetent index 

const express = require('express')
const router = express.Router()
const auth = require('../../../services/auth');
const contents = require('./contents.controller');


//contents
router.post('/', auth.isAuthenticated, contents.postContent);

//http://127.0.0.1:5200/board/1
router.get('/:id', auth.isAuthUserOrNot, contents.getContent);
router.put('/:id', auth.isAuthenticated,contents.updateContent);
router.delete('/:id', auth.isAuthenticated, contents.deleteConetent);

//inner comment
// router.get('/:id/comments', contents.getComments);

//match
router.get('/:id/relation/rating', contents.getPlayeRatings);
//tags
router.get('/:id/relation', auth.isAuthUserOrNot, contents.getRelationContents);
router.get('/:id/relation/match', contents.getRelationMatches);

//hifive
router.get('/:id/hifiveduser', contents.getHifivers)
router.put('/:id/hifive', auth.isAuthenticated, contents.setHifive);
router.put('/:id/unhifive', auth.isAuthenticated, contents.setUnHifive);

//scrap
// router.post(':/id/scrap', contents.getScraps);
router.get('/:id/scrapusers', contents.getScrapUsers)
router.post('/:id/scrap', auth.isAuthenticated, contents.postScrap);
router.delete('/:id/scrap', auth.isAuthenticated ,contents.deleteScrap);

//신고
router.put('/:id/reported', auth.isAuthenticated, contents.setReported);



module.exports = router;