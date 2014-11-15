var util = require('util')
  , EventEmitter  = require('events').EventEmitter;

StatusSolver = function StatusSolver(){

}

util.inherits(StatusSolver, EventEmitter)

StatusSolver.prototype.updateStatus = function updateStatus(/*Object*/obj, /*String Optional*/resultStatus) {
  var needResultStatusChange = typeof resultStatus == 'string';  //Ignore undefined or others
  var movedToComplete = false;
  var self = this;
  //processStatus: completed / inProcess
  //We only care about the inProcess one
  if(obj.processStatus != 'inProcess') {
    throw new Error('Illegal status: '+obj.id +' ' +obj.processStatus);
    return;
  }

  if(typeof obj.processedChildCount != 'undefined' && typeof obj.expectedChildCount != 'undefined') {
    if(obj.expectedChildCount == obj.processedChildCount){
      obj.processStatus = 'completed';
      movedToComplete = true
      self.emit('statusChange', obj);
    }
  }

  if(needResultStatusChange) {
    obj.resultStatus = resultStatus;
    obj.processStatus = 'completed';
    movedToComplete = true
    self.emit('statusChange', obj);
  }

  if(obj.parent){ //Need to notify parent if it has
    if(movedToComplete) {
      obj.parent.processedChildCount++;
    }

    if(obj.resultStatus == 'failed')
      self.updateStatus(obj.parent, 'failed');
    else
      self.updateStatus(obj.parent);
  }
}

StatusSolver.prototype.init = function init(obj){
  obj.processedChildCount = 0;
  obj.processStatus = 'notStarted';
  obj.resultStatus = 'unknown';
  this.emit('statusChange', obj);
}

StatusSolver.prototype.skip = function skip(obj){
  obj.expectedChildCount = 0;
  obj.processStatus = 'inProcess';
  obj.resultStatus = 'skipped';
  this.emit('statusChange', obj);
}

StatusSolver.prototype.start = function start(obj, childCount){
  if(typeof childCount != 'undefined')
    obj.expectedChildCount = childCount;
  obj.processStatus = 'inProcess';
  obj.resultStatus = 'passed';
  this.emit('statusChange', obj);
}

exports.StatusSolver = StatusSolver;
