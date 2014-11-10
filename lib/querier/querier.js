var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('Quieier');

var Querier = function Querier(client){
  this.client = client;
  logger.trace('Inited a new querier: ' + this.constructor.name);
};

util.inherits(Querier, EventEmitter);

Querier.prototype.internal = {};

exports.Querier = Querier;