var status = require('../status/status');

module.exports.Category = function(data) {

  var category = status.wrapType(status.category);
  category.data = data;
  return category;

}




