const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const auth = require('../middleware/auth');

router.post('/', auth(), reservationController.createReservation);
router.get('/', auth(), reservationController.getAllReservations);
router.get('/:id', auth(), reservationController.getReservationById);
router.put('/:id', auth(), reservationController.updateReservation);
router.delete('/:id', auth(), reservationController.deleteReservation);
router.get('/nearest', auth(), reservationController.getNearestReservations);

module.exports = router;
