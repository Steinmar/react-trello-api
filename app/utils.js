const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');

module.exports = {
  convertItemToFrontend: function(item) {
    return { id: item._id, ..._.omit(item, '_id') };
  },
  convertItemToDatabase: function(item) {
    return { _id: new ObjectID(item._id), ..._.omit(item, 'id') };
  }
};
