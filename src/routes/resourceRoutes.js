const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const auth = require('../middleware/auth');

router.post('/', auth(['administrador']), resourceController.createResource);
router.get('/', auth(), resourceController.getAllResources);
router.get('/:id', auth(), resourceController.getResourceById);
router.put('/:id', auth(['administrador']), resourceController.updateResource);
router.delete('/:id', auth(['administrador']), resourceController.deleteResource);

module.exports = router;
