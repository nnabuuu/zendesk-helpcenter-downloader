var util = require('util')
  , Job = require('./job.js').Job
  , GlobalQuerier = require('../querier/globalQuerier').GlobalQuerier
  , CategoryQuerier = require('../querier/categoryQuerier').CategoryQuerier
  , SectionQuerier = require('../querier/sectionQuerier').SectionQuerier
  , ArticleSaver = require('../saver/articleSaver').ArticleSaver
  , StatusSolver = require('../status/statusSolver').StatusSolver
  , log4js = require('log4js')
  , logger = log4js.getLogger('default')
  , AdmZip = require('adm-zip')
  , statusLogger = log4js.getLogger('status');

/**
 *
 * @param client
 * @param options {outputPath: 'somePath' }
 * @constructor
 */
var ArticleDownloadJob = function ArticleDownloadJob(client, options){
  Job.call(this, client, options);
  var self = this;

  self.articleSaver = new ArticleSaver(client);
  self.globalQuerier = new GlobalQuerier(client);
  self.categoryQuerier = new CategoryQuerier(client);
  self.sectionQuerier = new SectionQuerier(client);
  self.statusSolver = new StatusSolver();

  if(options.zip){
    self.zip = new AdmZip();
  }
  self.globalQuerier.on('start', function(){
    self.globalQuerier.query(function(err, categories) {
      if(err) {
        logger.debug('Fail to query global categories, nothing to execute');
        self.resultCollector = {processedCount: 0, expectedCount: 0, categories:[]};
      }
      else {
        logger.trace('Begin to emit data to category querier');
        self.resultCollector = {processedCount:0, expectedCount:categories.length, categories: categories};
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
          self.statusSolver.updateStatus(lastSection);
        }
        else {
          logger.debug('Query category ' + lastCategory.id +' success, ' + sections.length + 'sections belongs to this category');
          self.statusSolver.start(lastCategory, sections.length);
          self.statusSolver.updateStatus(lastCategory);
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
          self.statusSolver.updateStatus(lastSection);
        }
        else {
          logger.debug('Query section ' + lastSection.id +' success, ' + articles.length + ' articles belongs to this section');

          self.statusSolver.start(lastSection, articles.length);
          self.statusSolver.updateStatus(lastSection);
          logger.trace('Start section done: ' + lastSection.id + ' with partent ' + lastSection.parent.id + ' '+ lastSection.processStatus + ' ' + lastSection.resultStatus);
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
      if(self.options.zip)
      {
        self.articleSaver.saveToZipFile(article, self.zip, function(err, lastArticle){
          if(err) {
            self.emit('articleFail', lastArticle);
          }
          else {
            self.emit('articlePass', lastArticle);
          }
        })
      }
      else
      {
        self.articleSaver.saveToLocalDisk(article, self.options.outputPath, function(err, lastArticle){
          if(err) {
            self.emit('articleFail', lastArticle);
          }
          else {
            self.emit('articlePass', lastArticle);
          }
        })
      }

    }

  })

  self.on('articleFail', function(article){
    self.statusSolver.updateStatus(article, 'failed');
//    logger.info('Fail an article');
  });

  self.on('articlePass', function(article){
    self.statusSolver.updateStatus(article, 'passed');
//    logger.info('Pass an article: ' + article.processStatus + ' ' + article.resultStatus + ' ' +article.parent.processStatus + ' ' + article.parent.resultStatus + ' ' + article.parent.parent.processStatus + ' ' + article.parent.parent.resultStatus)
  });

  self.statusSolver.on('statusChange', function(obj) {
    self.emit('statusChange', obj);
    if(!obj.parent) {
      statusLogger.info("Category " + obj.id + " Status change to: " + obj.processStatus + " " + obj.resultStatus);
      if(obj.processStatus == 'completed')
        self.resultCollector.processedCount++;
      if(self.resultCollector.processedCount == self.resultCollector.expectedCount)
      {
        if(self.zip) {
          self.emit('done', {metaData: self.resultCollector, zip: self.zip})
        }
        else {
          self.emit('done', {metaData: self.resultCollector});
        }
      }
    } else if(obj.articles) {
      statusLogger.info("Section " + obj.id + " Status change to: " + obj.processStatus + " " + obj.resultStatus);
      statusLogger.info("Current parent processed child " + obj.parent.processedChildCount +" expecting changed " + obj.parent.expectedChildCount)
    } else if(obj.parent && !obj.child)
    {
      statusLogger.info("Article " + obj.id + " Status change to: " + obj.processStatus + " " + obj.resultStatus);
    }
    else {
      statusLogger.fatal("Unknown data");
    }
  })
}

util.inherits(ArticleDownloadJob, Job);

ArticleDownloadJob.prototype.process = function(callback){
  this.globalQuerier.emit('start');

}

exports.ArticleDownloadJob = ArticleDownloadJob;