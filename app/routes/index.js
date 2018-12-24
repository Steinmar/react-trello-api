const authRoutes = require('./auth_routes');
const boardRoutes = require('./board_routes');
const { tokenGenerator } = require('../encryption/index');

module.exports = function(app, db) {
  authRoutes(app, db);

  app.all('*', function(req, res, next) {
    const email = req.body.email.toLowerCase();
    const authHeader = req.headers.authtoken;

    if (tokenGenerator.isValid(email, authHeader)) {
      next();
    } else {
      res.send(401);
    }
  });

  boardRoutes(app, db);
};
