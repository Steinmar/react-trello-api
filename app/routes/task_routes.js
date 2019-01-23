const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const utils = require('../utils');
const PREFIX_URL = '/board/:boardId/column/:columnId/task';
// const COLLECTION_NAME = 'tasks';
const COLLECTION_NAME = 'columns';

module.exports = function(app, db) {
  app.post(PREFIX_URL, (req, res) => {
    const { boardId, columnId } = req.params;
    const { name, order, description } = req.body;
    const data = { name, order, columnId, description, boardId };

    findColumnDataById$(db, columnId).then(
      columnData => {
        const task = {
          status: columnData.name,
          ...data,
          // use this for generating id for object that hasn't get id from mongo
          _id: new ObjectID(Date.now())
        };

        const query = { _id: columnData._id };
        columnData.tasks.push(task);

        db.collection(COLLECTION_NAME).update(
          query,
          columnData,
          { upsert: true },
          (err, result) => {
            if (err) {
              res.send({ error: 'An error has occurred' });
            } else {
              if (result.result.ok === 1) {
                res.send(
                  utils.convertItemToFrontend({
                    ..._.omit(columnData, 'tasks'),
                    tasks: columnData.tasks.map(utils.convertItemToFrontend)
                  })
                );
              } else {
                res.setStatus(404).send({});
              }
            }
          }
        );
      },
      error => {
        res.send({
          error: 'An error has occurred. Can not set status'
        });
      }
    );
  });

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const { boardId, columnId } = req.params;

    findColumnDataByAndBoardColumnNames$(db, columnId, boardId)
      .then(foundData => {
        const columnData = foundData.column;
        const id = new ObjectID(req.params.id);
        const foundTask = columnData.tasks.find(task => {
          return new ObjectID(task._id).equals(id);
        });
        if (foundTask) {
          res.send({
            task: utils.convertItemToFrontend(foundTask),
            statuses: foundData.statuses
          });
        } else {
          res.status(404).send({ status: 404 });
        }
      })
      .catch(error => {
        res.send(error);
      });
  });

  app.put(PREFIX_URL + '/:id', (req, res) => {
    const { boardId, columnId, id } = req.params;
    const { name, order, description, status } = req.body;
    const data = { name, order, columnId, description, boardId, id, status };

    const task = { ...data };
    // if task changed status we need to remove it from an old column and add to a new

    findColumnDataById$(db, columnId)
      .then(columnData => {
        if (columnData.name === task.status) {
          const query = { _id: columnData._id };
          const updatedItemIndex = columnData.tasks.findIndex(element =>
            element._id.equals(new ObjectID(task.id))
          );
          const updatedTasks = _.map(columnData.tasks, _.clone);
          const newColumnData = _.clone(columnData);
          updatedTasks[updatedItemIndex] = utils.convertItemToDatabase(task);
          newColumnData.tasks = updatedTasks;

          db.collection(COLLECTION_NAME).update(
            query,
            newColumnData,
            (err, result) => {
              if (err) {
                res.send({ error: 'An error has occurred' });
              } else {
                res.send({ task: utils.convertItemToFrontend(task) });
              }
            }
          );
        } else {
          // move task to another column
        }
      })
      .catch(error => res.send({ error: 'An error has occurred' }));
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

function findColumnDataById$(db, columnId) {
  const columnsQuery = { _id: new ObjectID(columnId) };

  return new Promise((success, error) => {
    db.collection('columns').findOne(columnsQuery, (err, result) => {
      if (err) {
        error({ error: 'An error has occurred' });
      } else {
        success(result);
      }
    });
  });
}

function findColumnDataByAndBoardColumnNames$(db, columnId, boardId) {
  const columnsQuery = { _id: new ObjectID(columnId) };

  return new Promise((success, error) => {
    const boardsQuery = {
      boardId
    };

    db.collection('columns')
      .find(boardsQuery)
      .toArray((err, result) => {
        if (err) {
          error({ error: 'An error has occurred' });
        } else {
          success({
            column: result.find(column =>
              new ObjectID(column._id).equals(columnsQuery._id)
            ),
            statuses: result.map(column => column.name)
          });
        }
      });
  });
}
