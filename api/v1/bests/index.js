const express = require('express');
const router = express.Router();
const auth = require('../../../services/auth');
const bests = require('./bests.controller');

var db = require('../../../services/mysqlservice');

//게시판

//http://127.0.0.1:5300/v1/bests?boardid=200&bestid=20170807&type=L&bestroll=C

router.get('/', auth.isAuthUserOrNot, bests.getBests);
router.get('/:boardid', auth.isAuthUserOrNot, bests.getBestBoards);  

router.get('/temp/list/', auth.isAuthUserOrNot, bests.getTempBestAllList);
router.get('/temp/list/:boardid', auth.isAuthUserOrNot, bests.getTempBestList);  

// router.get('/', auth.isAuthUserOrNot, bests.getBasicBests);
//router.get('/:boardid', auth.isAuthUserOrNot, bests.getBasicBestBoards); 


//boardid=200&bestid=20180807

//router.get('/:besttype/:bestroll/:bestid/', bests.getBestBoards);

/*bestroll
c order by comment
l order by like
*/

/*besttype
l live, d day, w week, m month, y year
*/


// http://127.0.0.1:5300/v1/bests/100/best?bestid=20170807
// router.get('/:boardid',bests.getBests);



module.exports = router;