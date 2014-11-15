var util = require('util')
  , Querier = require('./querier').Querier
  , logger = require('log4js').getLogger('default');

var GlobalQuerier = function GlobalQuerier(client){
  Querier.call(this, client);
};

util.inherits(GlobalQuerier, Querier);

GlobalQuerier.prototype.query = function(/*Function*/callback){
  var self = this;
  logger.debug('Begin to query global categories information.');
  self.client.categories.list(function(err, code, res){
    logger.debug('Return from query global categories information.');
    if(err) {
      logger.error('Fail to query global categories information.');
      callback(err);
    }
    else{
      logger.info('Query global categories information success.');

      callback(null, res);
    }
  })
}

exports.GlobalQuerier = GlobalQuerier;