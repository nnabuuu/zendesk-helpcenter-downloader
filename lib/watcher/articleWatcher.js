var util = require('util')
  , EventEmitter  = require('events').EventEmitter;

ArticleWatcher = function ArticleWatcher(resultCollector){

  this.resultCollector = resultCollector;

}

util.inherits(ArticleWatcher, EventEmitter)

exports.ArticleWatcher = ArticleWatcher;
