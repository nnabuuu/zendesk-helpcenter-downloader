var util = require('util')
  , EventEmitter  = require('events').EventEmitter;

StatusSolver = function StatusSolver(){

}

util.inherits(StatusSolver, EventEmitter)

StatusSolver.prototype.updateStatus = function updateStatus(/*Object*/obj, /*String Optional*/resultStatus) {
  var needResultStatusChange = typeof resultStatus == 'string';  //Ignore undefined or others
  var changedStatus = false;
  //processStatus: completed / inProcess
  //We only care about the inProcess one
  if(obj.processStatus != 'inProcess') {
    //throw new Error('Illegal status: '+obj.processStatus);
    return;
  }

  if(typeof obj.processedChildCount != 'undefined' && typeof obj.expectedChildCount != 'undefined') {
    if(obj.expectedChildCount == obj.processedChildCount){
      obj.processStatus = 'completed';
      changedStatus = true
    }
  }

  if(obj.parent){ //Need to notify parent if it has
    if(needResultStatusChange) {
      obj.processStatus = 'completed';
      changedStatus = true
      obj.resultStatus = resultStatus;

    }
    if(changedStatus) {
      obj.parent.processedChildCount++;
    }
    if(obj.resultStatus == 'failed')
      updateStatus(obj.parent, 'failed');
    else
      updateStatus(obj.parent);
  }
}

StatusSolver.prototype.init = function init(obj){
  obj.processedChildCount = 0;
  obj.processStatus = 'notStarted';
  obj.resultStatus = 'unknown';
}

StatusSolver.prototype.skip = function skip(obj){
  obj.expectedChildCount = 0;
  obj.processStatus = 'completed';
  obj.resultStatus = 'skipped';
}

StatusSolver.prototype.start = function start(obj, childCount){
  if(typeof childCount != 'undefined')
    obj.expectedChildCount = childCount;
  obj.processStatus = 'inProcess';
  obj.resultStatus = 'passed';
  if(obj.processedChildCount == obj.expectedChildCount) // A Quick end, they are both 0
    obj.processStatus = 'completed';
}

exports.StatusSolver = StatusSolver;
