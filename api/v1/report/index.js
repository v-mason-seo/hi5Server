//conetent index 

const express = require('express')
const router = express.Router()

const report = require('./report.controller')
const auth = require('../../../services/auth')

//contents
router.post('/', auth.isAuthenticated, report.postReport)
router.put('/:id/close',auth.isAuthenticated, report.closeReport)


router.get('/:id', report.getReport)
// router.put('/:id', issue.editIssue)

router.put('/:id/activity',auth.isAuthenticated, report.appendActivity)


module.exports = router;

