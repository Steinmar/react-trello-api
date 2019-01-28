// const columnRoutes = require('./column_routes');
const _ = require('lodash');
const ObjectID = require('mongodb').ObjectID;
const { tokenGenerator } = require('../encryption/index');
const { AUTH_CONSTANTS } = require('../CONSTANTS');
const PREFIX_URL = '/board';
const COLLECTION_NAME = 'boards';
const COLUMNS_COLLECTION_NAME = 'columns';

module.exports = function(app, db) {
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

  app.get(PREFIX_URL + '/:id/details', (req, res) => {
    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );
    const query = { _id: new ObjectID(req.params.id), owner: { $eq: email } };
    const columnsQuery = { boardId: req.params.id };

    db.collection(COLLECTION_NAME).findOne(query, (err, boardResult) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        db.collection(COLUMNS_COLLECTION_NAME)
          .find(columnsQuery)
          .toArray((err, columnsResult) => {
            if (err) {
              res.send({ error: 'An error has occurred' });
            } else if (columnsResult) {
              res.send(
                parseDetailedBoardItemFromDB(boardResult, columnsResult)
              );
            } else {
              res.sendStatus(404);
            }
          });
      }
    });
  });

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

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );
    const query = { _id: new ObjectID(req.params.id), owner: { $eq: email } };

    db.collection(COLLECTION_NAME).findOne(query, (err, result) => {
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
    const query = { _id: new ObjectID(req.params.id), owner: { $eq: email } };
    const board = { name: name, owner: email };

    db.collection(COLLECTION_NAME).update(query, board, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.send({ id: id, name: name });
      }
    });
  });

  app.delete(PREFIX_URL + '/:id', (req, res) => {
    const email = tokenGenerator.getValidUserByToken(
      req.headers[AUTH_CONSTANTS.AUTH_HEADER_NAME]
    );
    const query = { _id: new ObjectID(req.params.id), owner: { $eq: email } };

    db.collection(COLLECTION_NAME).remove(query, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        db.collection('columns').remove(
          { boardId: req.params.id },
          (err, result) => {
            if (err) {
              res.send({ error: 'An error has occurred' });
            } else {
              res.send({ id: query._id });
            }
          }
        );

        // res.send({ id: query._id });
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

function parseDetailedBoardItemFromDB(board, columns) {
  return {
    id: board._id,
    name: board.name,
    columns: columns.map(parseColumnItemFromDB)
  };
}

function parseColumnItemFromDB(item) {
  return {
    id: item._id,
    tasks: item.tasks.map(parseTaskItemFromDB),
    ..._.omit(item, ['_id', 'tasks'])
  };
}

function parseTaskItemFromDB(item) {
  return {
    id: item._id,
    ..._.omit(item, '_id')
  };
}
