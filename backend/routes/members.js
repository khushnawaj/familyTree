const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/memberController');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getMembers);
router.post('/', auth, ctrl.createMember);
router.patch('/positions', auth, ctrl.updatePositions);
router.get('/:id', auth, ctrl.getMember);
router.put('/:id', auth, ctrl.updateMember);
router.delete('/:id', auth, ctrl.deleteMember);

module.exports = router;
