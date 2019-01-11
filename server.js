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

const subpath = express();
app.use(cors());
app.use(bodyParser());
app.use('/v1', subpath);
swagger.setAppHandler(subpath);

app.use(express.static('dist'));

swagger.setApiInfo({
  title: 'React trello API',
  description: 'API for simple trello clone react app',
  termsOfServiceUrl: '',
  contact: 'alexrybak.pr@gmail.com',
  license: 'MIT',
  licenseUrl: ''
});

subpath.get('/', function(req, res) {
  res.sendfile(__dirname + '/dist/index.html');
});

swagger.configureSwaggerPaths('', 'api-docs', '');

const domain = 'localhost';
if (argv.domain !== undefined) domain = argv.domain;
else
  console.log(
    'No --domain=xxx specified, taking default hostname "localhost".'
  );
var applicationUrl = 'http://' + domain;
swagger.configure(applicationUrl, '1.0.0');

// swagger end

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
