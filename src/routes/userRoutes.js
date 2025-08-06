const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register-whatsapp', userController.registerWhatsapp);
router.post('/verify-whatsapp', userController.verifyWhatsapp);
router.get('/:id', auth(), userController.getUserById);
router.put('/:id', auth(), userController.updateUser);
router.delete('/:id', auth(), userController.deleteUser);

module.exports = router;
