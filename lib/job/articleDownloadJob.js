var util = require('util')
  , Job = require('./job.js').Job
  , GlobalQuerier = require('../querier/globalQuerier').GlobalQuerier
  , CategoryQuerier = require('../querier/categoryQuerier').CategoryQuerier
  , SectionQuerier = require('../querier/sectionQuerier').SectionQuerier
  , ArticleSaver = require('../saver/articleSaver').ArticleSaver
  , ArticleWatcher = require('../watcher/articleWatcher').ArticleWatcher
  , logger = require('log4js').getLogger('default');

var ArticleDownloadJob = function ArticleDownloadJob(client, options){
  Job.call(this, client, options);
  var self = this;
  self.resultCollector = {};

  self.articleSaver = new ArticleSaver(client);
  self.globalQuerier = new GlobalQuerier(client, self.resultCollector);
  self.categoryQuerier = new CategoryQuerier(client, self.resultCollector);
  self.sectionQuerier = new SectionQuerier(client, self.resultCollector);
  self.articleWatcher = new ArticleWatcher(self.resultCollector);

  self.globalQuerier.on('start', function(){
    self.globalQuerier.query(function(err, categories) {
      if(err) {
        logger.debug('Fail to query global categories, nothing to execute');
      }
      else {
        self.categoryQuerier.emit('data', categories);
      }
    })
  })

  self.categoryQuerier.on('data', function(categories){
    for(var categoryIndex in categories){
      var category = categories[categoryIndex];
      self.categoryQuerier.query(category, function(err, sections){
        if(err) {
          logger.debug('Fail to query category ' + category.id + ", skip it");
        }
        else {
          logger.debug('Query category ' + category.id +' success');
          self.sectionQuerier.emit('data', sections);
        }
      })
    }
  })

  self.sectionQuerier.on('data', function(sections){
    for(var sectionIndex in sections){
      var section = sections[sectionIndex];
      self.sectionQuerier.query(section, function(err, articles){
        if(err) {
          logger.debug('Fail to query section ' + section.id + ", skip it");
        }
        else {
          logger.debug('Query section ' + section.id +' success');
          for(var articleIndex in articles) {
            self.articleSaver.emit('data', articles[articleIndex]);
          }
        }
      })
    }
  })

  self.articleSaver.on('data', function(article){
    self.articleSaver.save(article, self.options.outputPath, function(err, filePath){
      if(err) {
        self.articleWatcher.emit('fail', article);
      }
      else {
        self.articleWatcher.emit('pass', article);
      }
    })
  })

  //TODO
  self.articleWatcher.on('fail', function(article){
    logger.error(article.toString());
    logger.info(this.num++);
  });
  self.articleWatcher.on('pass', function(article){
    logger.info(article.toString());
    logger.info(this.num++);
  });

}

ArticleDownloadJob.prototype.process = function(callback){
  this.globalQuerier.emit('start');
}


exports.ArticleDownloadJob = ArticleDownloadJob;