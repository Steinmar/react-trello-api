const hashFunction = require('./hash');
const TOKEN_TIME = 2 * 60 * 1000;

module.exports = {
  generate: function(email) {
    const emailHash = hashFunction(email);
    const stampEndDate = new Date();

    stampEndDate.setMilliseconds(TOKEN_TIME);
    const validityDateStamp = stampEndDate.toISOString();

    return emailHash + '@' + validityDateStamp;
  },
  isValid: function(email, token) {
    if (!email || email.length === 0 || !token || token.length === 0) {
      return false;
    }
    const splitterPosition = token.indexOf('@');

    if (splitterPosition === -1) {
      return false;
    }

    const emailHash = hashFunction(email);
    const currentHash = token.substring(0, splitterPosition);

    if (emailHash !== currentHash) {
      return false;
    }

    const hashDate = new Date(token.substring(splitterPosition + 1));

    return new Date() < hashDate;
  }
};
