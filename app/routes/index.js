const authRoutes = require('./auth_routes');
const boardRoutes = require('./board_routes');
const columnRoutes = require('./column_routes');
const { tokenGenerator } = require('../encryption/index');
const { AUTH_CONSTANTS } = require('../CONSTANTS');

module.exports = function(app, db) {
  authRoutes(app, db);

  app.all('*', function(req, res, next) {
    if (
      tokenGenerator.getValidUserByToken(
        req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
      )
    ) {
      next();
    } else {
      res.send(401);
    }
  });

  boardRoutes(app, db);
  columnRoutes(app, db);
};
