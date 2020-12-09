const _ = require('lodash');

function Movie(_node) {
  _.extend(this, _node.properties);
}

module.exports = Movie;
