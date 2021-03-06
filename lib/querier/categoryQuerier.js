var util = require('util')
  , Querier = require('./querier').Querier
  , logger = require('log4js').getLogger('default');

var CategoryQuerier = function CategoryQuerier(/*Object*/client){
  Querier.call(this, client);
};

util.inherits(CategoryQuerier, Querier);

CategoryQuerier.prototype.query = function(/*Object*/category, /*Function*/callback){
  var self = this
    , categoryId = category.id;

  logger.debug('Begin to query category information, category id: ' + categoryId);
  self.client.sections.listByCategory(categoryId, function(err, code, res){
    logger.debug('Return from query category information, category id: ' + categoryId);
    if(err) {
      logger.error('Fail to query category information, category id: ' + categoryId);
      category.sections = [];
      callback(err, null, category);
    }
    else{
      logger.info('Query category information success, category id: ' + categoryId);

      //Need to do this because we have to set parent
      var sections = category.sections = [];
      for(var index in res) {
        var section = res[index];
        section.parent = category;
        sections.push(section);
      }
      callback(null, sections, category);
    }
  })
}

exports.CategoryQuerier = CategoryQuerier;