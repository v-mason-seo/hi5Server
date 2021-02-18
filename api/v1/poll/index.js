//conetent index 

const express = require('express')
const router = express.Router()

const poll = require('./poll.controller')
const auth = require('../../../services/auth')

//contents
router.post('/', auth.isAuthenticated, poll.postPoll)
router.get('/:id', poll.getPoll)
// router.put('/:id', issue.editIssue)
router.put('/:id/close',auth.isAuthenticated, poll.closePoll)
router.put('/:id/pick',auth.isAuthenticated, poll.userPick)

module.exports = router;

