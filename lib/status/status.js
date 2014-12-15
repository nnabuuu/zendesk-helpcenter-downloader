var EventEmitter = require('events').EventEmitter,
  emitter = new EventEmitter;

module.exports = {
  /**
   * status actions for category
   */
  category: {
    init: create_init('category'),
    update: update,
    complete: complete,
    kickoff: kickOff
  },
  /**
   * status actions for section
   */
  section: {
    init: create_init('section'),
    update: update,
    complete: complete,
    kickoff: kickOff
  },
  /**
   * status action for aticle
   */
  article: {
    init: create_init('article'),
    update: update,
    complete: complete
  },
  /**
   * Exposed emitter, to capture any event
   */
  emitter: emitter,

  /**
   * Wrap a category / section / article into a class
   */
  wrapType: wrapType
}

/**
 *
 * Create a init function as return
 *
 * @param   {String}    obj_type Object type, can be 'category' / 'section' / 'article'
 * @returns {Function}           Init function returned
 */
  function create_init(obj_type) {
    return function(object) {
      object.metaData = {
        type: obj_type,
        status: {
          process: ProcessStatus.NOT_STARTED,
          result: ResultStatus.UNKNOWN
        }
      };
      // article does not have children
      if(obj_type !== 'article') {
        object.metaData.children = {
          expected: 0,
          completed: 0
        }
      }
    }
  }

/**
 *
 * Mark an object's process status as 'completed', change result status if necessary
 * If no result status is offered in argument, it will only check child expectation to see
 * if the object is about to complete (without result change).
 *
 * @param {Object}            object Object to be marked
 * @param {String} {Optional} result Expected to be marked as, enum from status.ResultStatus
 * @returns {Boolean}                Whether actions is succeed
 */
  function complete (object, result) {

    if(typeof(result) !== 'undefined') {
      var updateSucceed = update(object, result)
    }

    object.metaData.status.process = ProcessStatus.COMPLETED;
    emitter.emit('complete', object);

    // If object has parent, mark it's competed child count +1, and check.
    if(object.parent) {
      if(_markChild(object.parent)){
        complete(object.parent);
      }
    }
    return updateSucceed;
  }

/**
 *
 * Increase an object's child complete count, after that, return whether object is ready to complete
 *
 * @param   {Object}  object Object to increase the child complete count
 * @returns {Boolean}        Whether object shoule be completed after incrase child complete count
 * @private
 */
  function _markChild(object) {
    object.metaData.children.completed++;
    return (object.metaData.children.completed == object.metaData.children.expected);
  }

/**
 *
 * Update an object's result status, but do not change process status
 * If object marked as fail and it has a parent, then mark the parent fail
 *
 * @param {Object}    object Object to be updated
 * @param {String}    result Enum from status.ResultStatus
 * @returns {Boolean}        Whether the update succeed
 */
  function update (object, result) {
    if(object.metaData.status.process == ProcessStatus.COMPLETED)
      return false;

    if(result !== object.metaData.status.result) {
      object.metaData.status.result = result;
      if(object.parent) {
        if(result === ResultStatus.FAIL)
          update(object.parent, ResultStatus.FAIL)
      }
    }
    else {
      //Object already the same result status, we no longer do update;
    }
    return true;
  }

/**
 *
 * Kickoff an object, set it's children count
 *
 * @param {Object} object   Object to be kicked off
 * @param {Array}  children Object's children
 */
function kickOff(object, children){
  object.children = children;
  object.metaData.children.expected = children.length;
  if(children.length === 0) {
    complete(object);
  } else {
    object.metaData.status.process = ProcessStatus.IN_PROCESS;
  }
}

/**
 *
 * Wrap a function, make func(a, b) to a.func(b)
 *
 * @param   {Function} statusFunction Function to be wrapped
 * @returns {Function}                Function generated
 */
function wrapStatusFunction(statusFunction){
  return function() {
    return statusFunction(this, arguments);
  }
}

/**
 *
 * Wrap a type, generate a type base.
 *
 * @param   {Object} statusType Should be category / section / article
 * @returns {Object}
 */
function wrapType(statusType) {
  var wrapped = {};
  for(var statusFunction in statusType) {
    wrapped[statusFunction] = wrapStatusFunction(statusType[statusFunction]);
  }
  return wrapped;
}

/**
 *
 * result status enum of an object.
 *
 * @type {{UNKNOWN: string, PASS: string, FAIL: string}}
 */
var ResultStatus = module.exports.ResultStatus = {
  UNKNOWN: 'unknown',
  PASS: 'pass',
  FAIL: 'fail'
}

/**
 *
 * process status enum of an object.
 *
 * @type {{NOT_STARTED: string, IN_PROCESS: string, COMPLETED: string}}
 */
var ProcessStatus  = module.exports.ProcessStatus = {
  NOT_STARTED: 'notStarted',
  IN_PROCESS: 'inProcess',
  COMPLETED: 'completed'
}


