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

    findColumnDataByBoardAndColumnIds$(db, columnId, boardId)
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

  // this things should be refactored in future.
  // don't have time to do it now
  app.put(PREFIX_URL + '/:id', (req, res) => {
    const { boardId, columnId, id } = req.params;
    const { name, order, description, status } = req.body;
    const data = { name, order, columnId, description, boardId, id, status };

    const task = { ...data };

    findColumnsDataByIdAndName$(db, columnId, task.status)
      .then(data => {
        const oldColumn = data.byId;
        const newColumn = data.byName;

        if (oldColumn.name === newColumn.name) {
          const query = { _id: oldColumn._id };
          const updatedItemIndex = oldColumn.tasks.findIndex(element =>
            element._id.equals(new ObjectID(task.id))
          );
          const updatedTasks = _.map(oldColumn.tasks, _.cloneDeep);
          const newColumnData = _.cloneDeep(oldColumn);
          updatedTasks[updatedItemIndex] = utils.convertItemToDatabase(task);
          newColumnData.tasks = updatedTasks;

          updateColumn$(db, query, newColumnData)
            .then(_ => {
              res.send({ task: utils.convertItemToFrontend(task) });
            })
            .catch(err => res.status(500).send(err));
        } else {
          // move task to another column
          const queryOldColumn = { _id: { $eq: oldColumn._id } };
          const queryNewColumn = { _id: { $eq: newColumn._id } };

          const updatedTaskCurrentIndex = oldColumn.tasks.findIndex(element =>
            element._id.equals(new ObjectID(task.id))
          );
          const oldColumnTasks = _.map(oldColumn.tasks, _.cloneDeep);
          const modifiedOldColumnData = _.cloneDeep(oldColumn);
          const movingTask = _.cloneDeep(
            oldColumnTasks[updatedTaskCurrentIndex]
          );
          const modifiedNewColumnData = _.cloneDeep(newColumn);

          oldColumnTasks.splice(updatedTaskCurrentIndex, 1);
          modifiedOldColumnData.tasks = oldColumnTasks.map((task, index) => ({
            ...task,
            order: index
          }));
          modifiedNewColumnData.tasks.push({
            ...movingTask,
            order: modifiedNewColumnData.tasks.length,
            columnId: newColumn._id,
            status: modifiedNewColumnData.name
          });

          const updateOldColumn$ = updateColumn$(
            db,
            queryOldColumn,
            modifiedOldColumnData
          );
          const updateNewColumn$ = updateColumn$(
            db,
            queryNewColumn,
            modifiedNewColumnData
          );

          Promise.all([updateOldColumn$, updateNewColumn$])
            .then(result => {
              const operationResult = result.reduce(
                (curr, prev) => {
                  return {
                    nModified: prev.nModified + curr.nModified,
                    ok: prev.ok + curr.ok
                  };
                },
                {
                  nModified: 0,
                  ok: 0
                }
              );
              return (
                operationResult.nModified === 2 && operationResult.ok === 2
              );
            })
            .then(wasSuccess => {
              if (wasSuccess) {
                res.send({ task: utils.convertItemToFrontend(task) });
              }
            })
            .catch(err => res.status(500).send(err));
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

function findColumnsDataByIdAndName$(db, column1Id, column2Name) {
  const column1ObjectID = new ObjectID(column1Id);
  const columnsQuery = {
    $or: [{ _id: { $eq: column1ObjectID } }, { name: { $eq: column2Name } }]
  };

  return new Promise((success, error) => {
    db.collection('columns')
      .find(columnsQuery)
      .toArray((err, result) => {
        if (err) {
          error({ error: 'An error has occurred' });
        } else {
          success({
            byId: result.find(column => column._id.equals(column1ObjectID)),
            byName: result.find(column => column.name === column2Name)
          });
        }
      });
  });
}
function findColumnDataByBoardAndColumnIds$(db, columnId, boardId) {
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

function updateColumn$(db, query, columnData) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTION_NAME).update(query, columnData, (err, result) => {
      if (err) {
        reject({ error: 'An error has occurred' });
      } else {
        resolve(result.result);
      }
    });
  });
}
