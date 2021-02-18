//conetent index 

const express = require('express')
const router = express.Router()

const tags = require('./tags.controller')
const auth = require('../../../services/auth')

//contents

router.get('/:tag', tags.getContainTagContent)
// router.put('/:id', issue.editIssue)

module.exports = router;

