const hashFunction = require('./hash');
const TOKEN_TIME = 2 * 60 * 1000;

module.exports = {
  generate: function(email) {
    const normalizedEmail = email.toLowerCase();
    const emailHash = hashFunction(normalizedEmail);
    const stampEndDate = new Date();

    stampEndDate.setMilliseconds(TOKEN_TIME);
    const validityDateStamp = stampEndDate.toISOString();

    return normalizedEmail + ';' + emailHash + '#' + validityDateStamp;
  },
  getValidUserByToken: function(token) {
    if (!token || token.length === 0) {
      return false;
    }
    const emailSplitterPosition = token.indexOf(';');
    const tokenSplitterPosition = token.indexOf('#');

    if (emailSplitterPosition === -1 || tokenSplitterPosition === -1) {
      return false;
    }

    const email = token.substring(0, emailSplitterPosition);
    const emailHash = hashFunction(email);
    const currentHash = token.substring(
      emailSplitterPosition + 1,
      tokenSplitterPosition
    );

    if (emailHash !== currentHash) {
      return false;
    }

    const hashDate = new Date(token.substring(tokenSplitterPosition + 1));

    return new Date() < hashDate ? email : null;
  }
};
