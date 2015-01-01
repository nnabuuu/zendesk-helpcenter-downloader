var AutoIncrementModel = require('./schema.js').AutoIncrementModel;
var JobModel = require('./schema.js').JobModel;
var Q = require('Q');

var check = function(){
var queryHistoricalJobPromise = JobModel.findOne().sort({id: -1}).limit(1).exec();
var queryCurrentJobAutoIncrementPromise = AutoIncrementModel.findOne({name: 'JobID'}).exec();


Q.all([queryHistoricalJobPromise, queryCurrentJobAutoIncrementPromise])
  .then(function(result){
    var maxIDJob = result[0],
        autoIncrement = result[1];

    var expectedSeqNumber = maxIDJob === null ? 1 : maxIDJob.id + 1;

    //If no autoIncrement exists, create one.
    if(autoIncrement === null) {
      var newAutoIncrementItem = new AutoIncrementModel;
      newAutoIncrementItem.name = 'JobID';
      newAutoIncrementItem.nextSeqNumber = expectedSeqNumber;
      newAutoIncrementItem.save();
    }
    //If already exist, check if it is valid
    else {
      var currentSeqNumber = autoIncrement.nextSeqNumber;
      if(expectedSeqNumber > currentSeqNumber) {
        AutoIncrementModel.findOneAndUpdate({name: 'JobID'}, {nextSeqNumber: expectedSeqNumber})
      } else {
      }
    }
  }, console.error)
  .done(function(){
    console.log("current job seq number:", globalAutoIncrement_Job);
  });
}

