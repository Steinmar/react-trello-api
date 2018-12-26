const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const PREFIX_URL = '/board/:boardId/task';
const COLLECTION_NAME = 'tasks';

module.exports = function(app, db) {
  app.post(PREFIX_URL, (req, res) => {
    const { boardId } = req.params;
    const { name, order, columnId, description } = req.body;
    const data = { name, order, columnId, description, boardId };

    findColumnNameById$(db, columnId).then(
      name => {
        const task = { status: name, ...data };

        db.collection(COLLECTION_NAME).insert(task, (err, result) => {
          if (err) {
            res.send({ error: 'An error has occurred' });
          } else {
            res.send(parseTaskItemFromDB(result.ops[0]));
          }
        });
      },
      error => {
        res.send({
          error: 'An error has occurred. Can not set status'
        });
      }
    );
  });

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(req.params.id) };

    db.collection(COLLECTION_NAME).findOne(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else if (result) {
        res.send(parseTaskItemFromDB(result));
      } else {
        res.sendStatus(404);
      }
    });
  });

  app.put(PREFIX_URL + '/:id', (req, res) => {
    const { boardId } = req.params;
    const { name, order, columnId, description } = req.body;
    const data = { name, order, columnId, description, boardId, id };

    findColumnNameById$(db, columnId).then(
      name => {
        const task = { status: name, ...data };
        const details = { _id: new ObjectID(id) };

        db.collection(COLLECTION_NAME).update(details, task, (err, result) => {
          if (err) {
            res.send({ error: 'An error has occurred' });
          } else {
            res.send(parseTaskItemFromDB(result.ops[0]));
          }
        });
      },
      error => {
        res.send({ error: 'An error has occurred' });
      }
    );
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

function parseTaskItemFromDB(item) {
  return { id: item._id, ..._.omit(item, '_id') };
}

function findColumnNameById$(db, columnId) {
  const columnsQuery = { _id: new ObjectID(columnId) };
  console.log(columnsQuery);
  return new Promise((success, error) => {
    db.collection('columns').findOne(columnsQuery, (err, result) => {
      if (err) {
        error({ error: 'An error has occurred' });
      } else {
        success(result.name);
      }
    });
  });
}
