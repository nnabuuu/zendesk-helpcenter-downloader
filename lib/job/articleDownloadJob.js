var util = require('util')
  , Job = require('./job.js').Job
  , GlobalQuerier = require('../querier/globalQuerier').GlobalQuerier
  , CategoryQuerier = require('../querier/categoryQuerier').CategoryQuerier
  , SectionQuerier = require('../querier/sectionQuerier').SectionQuerier
  , ArticleSaver = require('../saver/articleSaver').ArticleSaver
  , StatusSolver = require('./statusSolver').StatusSolver
  , logger = require('log4js').getLogger('default');


var ArticleDownloadJob = function ArticleDownloadJob(client, options){
  Job.call(this, client, options);
  var self = this;
  var resultCollector = self.resultCollector = {};

  self.articleSaver = new ArticleSaver(client);
  self.globalQuerier = new GlobalQuerier(client, resultCollector);
  self.categoryQuerier = new CategoryQuerier(client, resultCollector);
  self.sectionQuerier = new SectionQuerier(client, resultCollector);
  self.statusSolver = new StatusSolver;

  self.globalQuerier.on('start', function(){
    self.globalQuerier.query(function(err, categories) {
      if(err) {
        logger.debug('Fail to query global categories, nothing to execute');
      }
      else {
        logger.trace('Begin to emit data to category querier');
        self.categoryQuerier.emit('data', categories);
      }
    })
  })

  self.categoryQuerier.on('data', function(categories){
    for(var categoryIndex in categories){
      var category = categories[categoryIndex];
      self.statusSolver.init(category);
      self.categoryQuerier.query(category, function(err, sections, lastCategory){
        if(err) {
          logger.debug('Fail to query category ' + lastCategory.id + ", skip it");
          self.statusSolver.skip(lastCategory);
        }
        else {
          logger.debug('Query category ' + lastCategory.id +' success');
          self.statusSolver.start(lastCategory, sections.length);
          self.sectionQuerier.emit('data', sections);
        }
      })
    }
  })

  self.sectionQuerier.on('data', function(sections){
    for(var sectionIndex in sections){
      var section = sections[sectionIndex];
      self.statusSolver.init(section);
      logger.trace('Init section done: ' + section.processStatus + ' ' + section.resultStatus);
      self.sectionQuerier.query(section, function(err, articles, lastSection){
        if(err) {
          logger.debug('Fail to query section ' + lastSection.id + ", skip it");
          self.statusSolver.skip(lastSection);
        }
        else {
          logger.debug('Query section ' + lastSection.id +' success');
          self.statusSolver.start(lastSection, articles.length);
          logger.trace('Start section done: ' + lastSection.processStatus + ' ' + lastSection.resultStatus);
          self.articleSaver.emit('data', articles);
        }
      })
    }
  })

  self.articleSaver.on('data', function(articles){
    for(var articleIndex in articles) {
      var article = articles[articleIndex];
      if(article.parent.processStatus == 'notStarted')
      {
        logger.fatal('Parent not started!' + article+""+article.parent);
      }
      self.statusSolver.init(article);
      self.statusSolver.start(article);
      self.articleSaver.save(article, self.options.outputPath, function(err, lastArticle){
        if(err) {
          self.emit('articleFail', lastArticle);
        }
        else {
          self.emit('articlePass', lastArticle);
        }
      })
    }

  })

  self.on('articleFail', function(article){
    self.statusSolver.updateStatus(article, 'failed');
    logger.info('Fail an article');
  });

  self.on('articlePass', function(article){
    self.statusSolver.updateStatus(article, 'passed');
    logger.info('Pass an article: ' + article.processStatus + ' ' + article.resultStatus + ' ' +article.parent.processStatus + ' ' + article.parent.resultStatus + ' ' + article.parent.parent.processStatus + ' ' + article.parent.parent.resultStatus)
  });

}

util.inherits(ArticleDownloadJob, Job);

ArticleDownloadJob.prototype.process = function(callback){
  this.globalQuerier.emit('start');
}

exports.ArticleDownloadJob = ArticleDownloadJob;