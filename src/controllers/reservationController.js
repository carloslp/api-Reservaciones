const Reservation = require('../models/Reservation');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Joi = require('joi');

async function isOverlapping(resourceId, startTime, endTime, excludeId = null) {
  const query = {
    resourceId,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  if (excludeId) query.id = { $ne: excludeId };
  return await Reservation.findOne(query);
}

exports.createReservation = async (req, res) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    resourceId: Joi.string().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    location: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2)
    }).optional(),
    notes: Joi.string().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { userId, resourceId, startTime, endTime, location, notes } = req.body;
  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ error: 'startTime debe ser anterior a endTime' });
  }
  const user = await User.findOne({ id: userId });
  const resource = await Resource.findOne({ id: resourceId, isActive: true });
  if (!user || !resource) return res.status(404).json({ error: 'Usuario o recurso no encontrado' });

  const overlap = await isOverlapping(resourceId, startTime, endTime);
  if (overlap) return res.status(409).json({ error: 'Conflicto: el recurso ya está reservado en ese horario' });

  const reservation = new Reservation({
    userId, resourceId, startTime, endTime, location, notes, status: 'pendiente'
  });
  await reservation.save();
  res.status(201).json(reservation);
};

exports.getAllReservations = async (req, res) => {
  // Filtros: userId, resourceId, status, startDate, endDate
  const { userId, resourceId, status, startDate, endDate } = req.query;
  let query = {};
  if (userId) query.userId = userId;
  if (resourceId) query.resourceId = resourceId;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }
  const reservations = await Reservation.find(query);
  res.json(reservations);
};

exports.getReservationById = async (req, res) => {
  const reservation = await Reservation.findOne({ id: req.params.id });
  if (!reservation) return res.status(404).json({ error: 'Reservación no encontrada' });
  res.json(reservation);
};

exports.updateReservation = async (req, res) => {
  const schema = Joi.object({
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    status: Joi.string().valid('confirmada', 'pendiente', 'cancelada', 'completada').optional(),
    notes: Joi.string().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const reservation = await Reservation.findOne({ id: req.params.id });
  if (!reservation) return res.status(404).json({ error: 'Reservación no encontrada' });

  if (req.body.startTime || req.body.endTime) {
    const startTime = req.body.startTime || reservation.startTime;
    const endTime = req.body.endTime || reservation.endTime;
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'startTime debe ser anterior a endTime' });
    }
    const overlap = await isOverlapping(reservation.resourceId, startTime, endTime, reservation.id);
    if (overlap) return res.status(409).json({ error: 'Conflicto: el recurso ya está reservado en ese horario' });
    reservation.startTime = startTime;
    reservation.endTime = endTime;
  }
  if (req.body.status) reservation.status = req.body.status;
  if (req.body.notes) reservation.notes = req.body.notes;
  await reservation.save();
  res.json(reservation);
};

exports.deleteReservation = async (req, res) => {
  const reservation = await Reservation.findOneAndDelete({ id: req.params.id });
  if (!reservation) return res.status(404).json({ error: 'Reservación no encontrada' });
  res.json({ message: 'Reservación eliminada' });
};

exports.getNearestReservations = async (req, res) => {
  const { latitude, longitude, maxDistance = 1000, unit = 'm', limit = 10, startTime } = req.query;
  if (!latitude || !longitude) return res.status(400).json({ error: 'latitude y longitude requeridos' });
  let distance = parseFloat(maxDistance);
  if (unit === 'km') distance *= 1000;
  if (unit === 'miles') distance *= 1609.34;
  const query = {
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        $maxDistance: distance
      }
    }
  };
  if (startTime) query.startTime = { $gte: new Date(startTime) };
  const reservations = await Reservation.find(query).limit(parseInt(limit));
  res.json(reservations);
};
