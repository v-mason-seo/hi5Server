//conetent index 

const express = require('express')
const router = express.Router()

const issue = require('./issue.controller')
const auth = require('../../../services/auth')

//contents
router.post('/', auth.isAuthenticated, issue.postIssue)
router.put('/:id/close',auth.isAuthenticated, issue.closeIssue)


router.get('/:id', issue.getIssue)
// router.put('/:id', issue.editIssue)

router.put('/:id/activity',auth.isAuthenticated, issue.appendActivity)


module.exports = router;

