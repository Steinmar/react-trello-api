const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const argv = require('minimist')(process.argv.slice(2));
const swagger = require('swagger-node-express');
const app = express();
const db = require('./config/db');
const port = 8000;

// swagger start

app.use(
  cors({
    exposedHeaders: 'authToken'
  })
);
app.use(bodyParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
