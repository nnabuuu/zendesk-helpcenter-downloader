var util = require('util')
  , Querier = require('./querier').Querier
  , logger = require('log4js').getLogger('default');

var GlobalQuerier = function GlobalQuerier(client, collector){
  Querier.call(this, client, collector);
};

util.inherits(GlobalQuerier, Querier);

GlobalQuerier.prototype.query = function(/*Function*/callback){
  var self = this;
  logger.debug('Begin to query global categories information.');
  self.client.categories.list(function(err, code, res){
    logger.debug('Return from query global categories information.');
    if(err) {
      logger.error('Fail to query global categories information.');
      if(self.collector) {
        self.collector.categories = [];
      }
      callback(err);
    }
    else{
      logger.info('Query global categories information success.');
      var categories;
      if(self.collector) {
        categories = self.collector.categories = [];
        for(var index in res) {
          var category = res[index];
          self.collector.categories.push(category);
        }
      }
      else {
        categories = res;
      }
      callback(null, categories);
    }
  })
}

exports.GlobalQuerier = GlobalQuerier;