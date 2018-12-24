const ObjectID = require('mongodb').ObjectID;
const PREFIX_URL = '/board';

module.exports = function(app, db) {
  app.post(PREFIX_URL, (req, res) => {
    const name = req.body.name;
    const email = req.body.email.toLowerCase();

    db.collection('boards').insert(
      { name: name, user: email },
      (err, result) => {
        if (err) {
          res.send({ error: 'An error has occurred' });
        } else {
          res.sendStatus(201);
        }
      }
    );

    console.log(name);
  });

  app.get(PREFIX_URL + '/list', (req, res) => {
    console.log(req.params);
    const email = req.params.email.toLowerCase();
    const query = {
      email: { $eq: email }
    };

    db.collection('boards')
      .find(query)
      .toArray((err, result) => {
        if (err) {
          res.send({ error: 'An error has occurred' });
        } else {
          res.sendStatus(result);
        }
      });

    console.log(name);
  });

  app.get(PREFIX_URL + '/:id', (req, res) => {
    const id = req.params.id;
    const details = { _id: new ObjectID(id) };

    db.collection('boards').findOne(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(result);
      }
    });

    console.log(name);
  });

  app.put(PREFIX_URL + '/:id', (req, res) => {
    const name = req.body.name;
    const email = req.body.email.toLowerCase();

    const id = req.params.id;
    const details = { _id: new ObjectID(id) };
    const board = { name, email };

    db.collection('boards').update(details, board, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(201);
      }
    });
  });

  app.delete(PREFIX_URL + '/:id', (req, res) => {
    const details = { _id: new ObjectID(id) };

    db.collection('boards').remove(details, (err, result) => {
      if (err) {
        res.send({ error: 'An error has occurred' });
      } else {
        res.sendStatus(201);
      }
    });

    console.log(name);
  });
};
