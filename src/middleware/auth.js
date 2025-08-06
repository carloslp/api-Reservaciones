const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return (req, res, next) => {
    if (process.env.DISABLE_AUTH === 'true') {
      // Autenticación desactivada, simula usuario admin
      req.user = { id: 'test', role: 'administrador' };
      return next();
    }
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
};
