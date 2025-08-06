// Solo cargar .env si no estamos en producción (Docker)
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  require('dotenv').config();
  console.log('Variables cargadas desde .env:', process.env);
} else {
  console.log('Variables cargadas desde entorno Docker:', process.env);
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const reservationRoutes = require('./routes/reservationRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/reservations', reservationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`)))
  .catch(err => console.error('Error de conexión a MongoDB:', err));
