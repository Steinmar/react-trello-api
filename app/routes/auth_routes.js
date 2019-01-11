const { hashFunction, tokenGenerator } = require('../encryption/index');
const COLLECTION_NAME = 'users';

module.exports = function(app, db) {
  app.post('/sign-up', (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email.toLowerCase();
    const user = { name, email, password: hashFunction(password) };
    const query = { email: { $eq: email } };
    let foundPromiseSuccess;
    let foundPromiseError;
    const foundPromise = new Promise((success, error) => {
      foundPromiseSuccess = success;
      foundPromiseError = error;
    });

    db.collection(COLLECTION_NAME).findOne(query, (err, result) => {
      if (err) {
        foundPromiseError(err);
      }
      foundPromiseSuccess(result);
    });

    foundPromise.then(
      foundUser => {
        if (!foundUser) {
          db.collection('users').insert(user, (err, result) => {
            if (err) {
              res.send({ error: 'An error has occurred' });
            } else {
              const { name, email } = result.ops[0];
              res.send({ name, email });
            }
          });
        } else {
          res.status(500).send({ error: "Email isn't unique!" });
        }
      },
      error => {
        throw error;
      }
    );
  });

  app.post('/login', (req, res) => {
    const password = req.body.password;
    const email = req.body.email.toLowerCase();

    const query = {
      email: { $eq: email },
      password: { $eq: hashFunction(password) }
    };

    db.collection(COLLECTION_NAME).findOne(query, (err, result) => {
      if (err) {
        throw err;
      }

      if (result) {
        const { name, email } = result;
        const token = tokenGenerator.generate(email);
        res.setHeader('authToken', token);

        res.send({ name, email });
      } else {
        res
          .status(404)
          .send({ error: 'User with this email and password was not found' });
      }
    });
  });
};
