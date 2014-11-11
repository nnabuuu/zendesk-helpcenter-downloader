var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('default');

var Querier = function Querier(client, collector){
  this.client = client;
  this.collector = collector;
  logger.trace('Inited a new querier: ' + this.constructor.name);
};

util.inherits(Querier, EventEmitter);

exports.Querier = Querier;