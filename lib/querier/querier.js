var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , client = require('node-zendesk').createClient({
    username: 'zjsnxc@gmail.com'
    , password: '11223344'
    , subdomain: 'testbyx'
    , helpcenter: true
  })
  , logger = require('log4js').getLogger('Quieier');

var Querier = function Querier(){
  logger.debug('Inited a new querier: ' + this.constructor.name);
};

util.inherits(Querier, EventEmitter);

Querier.prototype.client = client;
Querier.prototype.internal = {};

exports.Querier = Querier;