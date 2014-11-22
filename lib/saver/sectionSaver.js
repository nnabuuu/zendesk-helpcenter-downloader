var util = require('util')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('default');

var SectionSaver = function SectionSaver() {
  logger.trace('Inited a new saver: ' + this.constructor.name);
}

util.inherits(SectionSaver, EventEmitter);