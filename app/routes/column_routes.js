const ObjectID = require('mongodb').ObjectID;
const { tokenGenerator } = require('../encryption/index');
const { AUTH_CONSTANTS } = require('../CONSTANTS');
const _ = require('lodash');
const PREFIX_URL = '/board/:boardId/column';
const COLLECTION_NAME = 'columns';

module.exports = function(app, db) {
  app.post(PREFIX_URL, (req, res) => {
    const { boardId } = req.params;
    const { name, order, tasks } = req.body;
    const data = { name, order, tasks, boardId };

    db.collection(COLLECTION_NAME).insert(data, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.send(parseColumnItemFromDB(result.ops[0]));
      }
    });
  });

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };

    db.collection(COLLECTION_NAME).findOne(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else if (result) {
        res.send(parseColumnItemFromDB(result));
      } else {
        res.sendStatus(404);
      }
    });
  });

  app.put(PREFIX_URL + '/:id', (req, res) => {
    const { boardId, id } = req.params;
    const { name, order, tasks } = req.body;
    const data = { name, order, tasks, boardId };

    const details = { _id: new ObjectID(id) };

    db.collection(COLLECTION_NAME).update(details, data, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(200);
      }
    });
  });

  app.delete(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };

    db.collection(COLLECTION_NAME).remove(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(201);
      }
    });
  });
};

function parseColumnItemFromDB(item) {
  return { id: item._id, ..._.omit(item, '_id') };
}
