const Resource = require('../models/Resource');
const Reservation = require('../models/Reservation');
const Joi = require('joi');

exports.createResource = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    capacity: Joi.number().required(),
    location: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2)
    }).required(),
    description: Joi.string().optional(),
    isActive: Joi.boolean().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const resource = new Resource(req.body);
  await resource.save();
  res.status(201).json(resource);
};

exports.getAllResources = async (req, res) => {
  const { type, capacity, text, latitude, longitude, maxDistance = 1000, unit = 'm', startDate, endDate } = req.query;
  let query = {};
  if (type) query.type = type;
  if (capacity) query.capacity = { $gte: parseInt(capacity) };
  if (text) query.name = { $regex: text, $options: 'i' };
  if (latitude && longitude) {
    let distance = parseFloat(maxDistance);
    if (unit === 'km') distance *= 1000;
    if (unit === 'miles') distance *= 1609.34;
    query.location = {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        $maxDistance: distance
      }
    };
  }
  let resources = await Resource.find(query);
  // Disponibilidad por rango de fechas
  if (startDate && endDate) {
    const reservedResourceIds = await Reservation.find({
      $or: [
        { startTime: { $lt: endDate }, endTime: { $gt: startDate } }
      ]
    }).distinct('resourceId');
    resources = resources.filter(r => !reservedResourceIds.includes(r.id));
  }
  res.json(resources);
};

exports.getResourceById = async (req, res) => {
  const resource = await Resource.findOne({ id: req.params.id });
  if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });
  res.json(resource);
};

exports.updateResource = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    type: Joi.string().optional(),
    capacity: Joi.number().optional(),
    location: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2)
    }).optional(),
    description: Joi.string().optional(),
    isActive: Joi.boolean().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const resource = await Resource.findOne({ id: req.params.id });
  if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });
  Object.assign(resource, req.body);
  await resource.save();
  res.json(resource);
};

exports.deleteResource = async (req, res) => {
  const resource = await Resource.findOneAndDelete({ id: req.params.id });
  if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });
  res.json({ message: 'Recurso eliminado' });
};
