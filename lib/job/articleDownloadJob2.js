/**
 * Event: 'start'
 * function () { }
 * Emitted when job starts
 *
 * Event: 'data.object.new'
 * function (arrayOfNewObjects) { }
 * Emitted when a bunch of objects are explored from zendesk server
 *
 * Event: 'data.object.complete'
 * function (object) { }
 * Emitted when an object's status changes to complete
 *
 * Event: 'end'
 * function (result) { }
 * Emitted when job ends.
 * Result wraps information and any output that is expected from this job.
 * (eg. a zip file when job is asked to zip all articles)
 */
var util = require('util'),
  Job = require('./job.js').Job,
  ArticleSaver = require('../saver/articleSaver.js').ArticleSaver,
  AdmZip = require('adm-zip'),
  status = require('../status/status.js');

/**
 *
 * @param client
 * @param options
 * @constructor
 */
var ArticleDownloadJob = function ArticleDownloadJob(client, options) {
  Job.call(this, client, options);
}

util.inherits(ArticleDownloadJob, Job);

ArticleDownloadJob.prototype.start = function() {
  var self = this,
    client = self.client,
    zip = new AdmZip,
    children = {
    expected: 0,
      completed: 0
  };

  self.emit('start');

  fillChildren(null, client.categories, client.categories.list, function(err, categories) {
    if(err) {
      self.emit('error', err);
    }
    else {
      self.emit('object.new', categories);
      self.emit('_newObjects.categories', categories);
    }
  })

  /**
   * When categories arrive, query sub sections
   */
  self.on('_newObjects.categories', function(categories){
    children.expected = categories.length;
    console.log(categories.length + ' categories explored');
    for(var categoryIndex in categories) {
      var category = categories[categoryIndex];
      status.category.init(category);
      fillChildren(category, client.sections, client.sections.listByCategory, function(err, sections) {
        if(err) {
          self.emit('error', err);
        }
        else {
          self.emit('object.new', sections);
          self.emit('_newObjects.sections', sections);
        }
      })
    }
  })

  /**
   * When sections arrive, query sub articles
   */
  self.on('_newObjects.sections', function(sections){
    for(var sectionIndex in sections) {
      var section = sections[sectionIndex];
      status.section.init(section);
      fillChildren(section, client.articles, client.articles.listBySection, function(err, articles) {
        if(err) {
          self.emit('error', err);
        }
        else {
          self.emit('object.new', articles);
          self.emit('_newObjects.articles', articles);
        }
      })
    }
  })

  /**
   * When articles arrive, save article to zip
   */
  self.on('_newObjects.articles', function(articles) {
    var articleSaver = new ArticleSaver;
    for(var articleIndex in articles) {
      var article = articles[articleIndex];
      status.article.init(article);
        articleSaver.saveToZipFile(article, zip, function(err, article){
        if(err) {
          status.article.complete(article, status.ResultStatus.FAIL);
          self.emit('error', err);
        }
        else {
          status.article.complete(article, status.ResultStatus.PASS);
        }
      })
    }
  })

  self.on('_complete.category', function(category){
    children.completed++;
    if(children.completed === children.expected) {
      self.emit('end', zip);
    }
  })


  status.emitter.on('complete', function(object) {
    self.emit('object.complete', object);
    if(object.metaData.type === 'category') {
      self.emit('_complete.category', object);
    }
  });



}

/**
 * Query subsequent children under a 'global space' (null) / category / section
 * All children will have a parent reference unless querying under 'global space'
 *
 * @param {Object}   obj       Object to query, fill with null if querying global categories
 * @param {Object} clientFuncStub Implementation of the query
 * @param {Function} callback  Function to callback with response
 */
function fillChildren(obj, client, listFunction, callback) {
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
function wrapParent(children, parent) {
  //Parameter check
  if(typeof(children) !== 'object' || typeof(parent) !== 'object')
    return children;

  for(var index in children) {
    children[index].parent = parent;
  }
  return children;
}

exports.ArticleDownloadJob = ArticleDownloadJob;
