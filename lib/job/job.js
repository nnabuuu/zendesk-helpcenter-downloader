var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('default')
  , status = require('../status/status.js');

var Job = function Job(client, options){
  logger.trace('Inited new job ' + this.constructor.name);
  this.client = client;
  this.options = options;
}

util.inherits(Job, EventEmitter);

/**
 * Query subsequent children under a 'global space' (null) / category / section
 * All children will have a parent reference unless querying under 'global space'
 *
 * @param {Object}   obj       Object to query, fill with null if querying global categories
 * @param {Object} clientFuncStub Implementation of the query
 * @param {Function} callback  Function to callback with response
 */
Job.prototype.fillChildren = function(obj, client, listFunction, callback) {
  //Parameter check
  if(typeof(obj) !== 'object' || typeof(client) !== 'object' || typeof(listFunction) !== 'function'||typeof(callback) !== 'function')
    callback(new Error('Invalid parameter'));

  if(obj && obj.id) {
    listFunction.call(client, obj.id, function(err, code, res){
      if(err) {
        callback(err);
      }
      else {
        status[obj.metaData.type].kickoff(obj, res);
        callback(null, wrapParent(res, obj));
      }
    })
  } else {
    listFunction.call(client, function(err, code, res){
      if(err) {
        callback(err);
      }
      else {
        callback(null, res);
      }
    })
  }
}

/**
 * Set parent reference for a bunch of children.
 * If either children or parent is not an object, leave the children untouched.
 *
 * @private
 * @param   {Object} children
 * @param   {Object} parent
 * @returns {Object} Same children as input
 */
var wrapParent = function(children, parent) {
  //Parameter check
  if(typeof(children) !== 'object' || typeof(parent) !== 'object')
    return children;

  for(var index in children) {
    children[index].parent = parent;
  }
  return children;
}

exports.Job = Job;
