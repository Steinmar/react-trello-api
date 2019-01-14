const ObjectID = require('mongodb').ObjectID;
const { tokenGenerator } = require('../encryption/index');
const { AUTH_CONSTANTS } = require('../CONSTANTS');
const PREFIX_URL = '/board';
const COLLECTION_NAME = 'boards';

module.exports = function(app, db) {
  app.post(PREFIX_URL, (req, res) => {
    const name = req.body.name;

    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );

    db.collection(COLLECTION_NAME).insert(
      { name: name, owner: email },
      (err, result) => {
        if (err) {
          res.send({ error: 'An error has occurred' });
        } else {
          res.send(parseBoardItemFromDB(result.ops[0]));
        }
      }
    );
  });

  app.get(PREFIX_URL + '/list', (req, res) => {
    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );
    const query = {
      owner: { $eq: email }
    };

    db.collection(COLLECTION_NAME)
      .find(query)
      .toArray((err, result) => {
        if (err) {
          res.send({ error: 'An error has occurred' });
        } else {
          res.send(result.map(parseBoardItemFromDB));
        }
      });
  });

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };

    db.collection(COLLECTION_NAME).findOne(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.send(parseBoardItemFromDB(result));
      }
    });
  });

  app.put(PREFIX_URL + '/:id', (req, res) => {
    const name = req.body.name;
    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );

    const id = req.params.id;
    const details = { _id: new ObjectID(id) };
    const board = { name: name, owner: email };

    db.collection(COLLECTION_NAME).update(details, board, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(board);
      }
    });
  });

  app.delete(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };

    db.collection(COLLECTION_NAME).remove(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus({ id: details._id });
      }
    });
  });
};

function parseBoardItemFromDB(item) {
  return {
    name: item.name,
    id: item._id
  };
}
