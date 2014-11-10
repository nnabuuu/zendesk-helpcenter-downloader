var util = require('util')
  , Querier = require('./querier').Querier
  , logger = require('log4js').getLogger('GlobalQuerier');

var GlobalQuerier = function GlobalQuerier(client){
  Querier.call(this, client);
};

util.inherits(GlobalQuerier, Querier);

GlobalQuerier.prototype.process = function(callback){
  var self = this;
  logger.debug('Begin to query global categories information.');
  self.client.categories.list(function(err, code, res){
    logger.debug('Return from query global categories information.');
    if(err) {
      logger.error('Fail to query global categories information.');
      self.internal.categories = [];
      callback(err);
    }
    else{
      logger.info('Query global categories information success.');
      var categories = self.internal.categories = [];
      for(var index in res) {
        var category = res[index];
        self.internal.categories.push(category);
      }
      callback(null, categories);
    }
  })
}

exports.GlobalQuerier = GlobalQuerier;