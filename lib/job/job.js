var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('default');

var Job = function Job(client, options){
  logger.trace('Inited new job ' + this.constructor.name);
  this.client = client;
  this.options = options;
}

util.inherits(Job, EventEmitter);

exports.Job = Job;
