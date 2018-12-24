module.exports = function(value) {
  let hash = 0;

  if (value.length == 0) {
    return hash;
  }
  for (let i = 0; i < value.length; i++) {
    var char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};
