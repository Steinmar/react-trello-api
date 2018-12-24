const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();
const db = require('./config/db');
const port = 8000;

// MongoClient.connect(
//   url,
//   (err, db) => {
//     if (err) {
//       throw err;
//     }
//     const dbo = db.db(DB_NAME);
//     console.log('Database created!');
//     db.close();
//   }
// );

app.use(bodyParser.urlencoded({ extended: true }));

// require('./app/routes')(app, {});

// app.listen(port, () => {
//   console.log('We are live on ' + port);
// });

MongoClient.connect(
  db.url,
  (err, database) => {
    if (err) {
      return console.log(err);
    }
    require('./app/routes')(app, database);
    app.listen(port, () => {
      console.log('We are live on ' + port);
    });
  }
);
