const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const otpStore = {};

exports.registerWhatsapp = async (req, res) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().required()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[req.body.phoneNumber] = otpCode;
  // Simulación de envío por WhatsApp
  console.log(`OTP para ${req.body.phoneNumber}: ${otpCode}`);
  res.json({ message: 'OTP enviado por WhatsApp (simulado)' });
};

exports.verifyWhatsapp = async (req, res) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().required(),
    otpCode: Joi.string().required()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { phoneNumber, otpCode } = req.body;
  if (otpStore[phoneNumber] !== otpCode) {
    return res.status(400).json({ error: 'OTP inválido' });
  }
  let user = await User.findOne({ phoneNumber });
  if (!user) {
    user = new User({ id: uuidv4(), phoneNumber, isWhatsappVerified: true });
    await user.save();
  } else {
    user.isWhatsappVerified = true;
    await user.save();
  }
  delete otpStore[phoneNumber];
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
};

exports.getUserById = async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  Object.assign(user, req.body);
  await user.save();
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findOneAndDelete({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado' });
};
