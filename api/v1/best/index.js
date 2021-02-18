const express = require('express');
const router = express.Router();
const auth = require('../../../services/auth');
const best = require('./best.controller');

var db = require('../../../services/mysqlservice');

//게시판

//http://127.0.0.1:5300/v1/bests?boardid=200&bestid=20170807&type=L&bestroll=C

router.get('/', auth.isAuthUserOrNot, best.getBestsContents);
router.get('/:boardid', auth.isAuthUserOrNot, best.getBoardBestContents);  


module.exports = router;