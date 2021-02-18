//conetent index 

const express = require('express')
const router = express.Router()

const notification = require('./notification.controller')
const auth = require('../../../services/auth')



router.get('/', auth.isAuthenticated, notification.getNotification)
router.put('/:id/confirm',auth.isAuthenticated, notification.confirmNotification)
// router.put('/:id/confirm',auth.isAuthenticated, notification.confirmNotification2)
//
// == 임시버전 ==
// recever_id, notification_id로 하면 읽음 표시가 잘 안된다.
// notification_type_id, content_id로 읽음 처리
//
router.put('/:id/confirm/group',auth.isAuthenticated, notification.confirmGroupNotification)
router.put('/confirm',auth.isAuthenticated, notification.confirmGroupNotification) //router.put('/:id',auth.isAuthenticated, notification.confirmXXX) <있을시 문제발생 위에껄로 대체 요청


router.put('/:id/allconfirm',auth.isAuthenticated, notification.confirmAllNotification)


// router.get('/', notification.getNotification)
// router.put('/:id/confirm', notification.confirmNotification)


module.exports = router;

