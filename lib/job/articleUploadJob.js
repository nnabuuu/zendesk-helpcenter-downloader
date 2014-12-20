var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  Job = require('./job.js').Job,
  status = require('../status/status.js'),
  cheerio = require('cheerio'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter;

/**
 *
 * @param client
 * @param options {path: somePath, locale: locale}
 * @constructor
 */
var ArticleUploadJob = function ArticleUploadJob(client, options) {
  Job.call(this, client, options);
}

var Explorer = function Explorer(folderPath, isValidFile){
  this.folderPath = folderPath;
  this.isValidFile = isValidFile;
}

var Uploader = function Uploader(client, articleProgress, locale){
  this.client = client;
  this.articleProgress = articleProgress;
  this.locale = locale;
}

util.inherits(ArticleUploadJob, Job);
util.inherits(Explorer, EventEmitter);
util.inherits(Uploader, EventEmitter);

ArticleUploadJob.prototype.start = function() {
  var self = this,
    exploredCount = 0,
    articleProgress = {
      expected: 0,
      completed: 0,
      articleFiles: []
    };

  var articleExplorer = new Explorer(self.options.path, isValidArticleFile);


  articleExplorer.on('data', function(filepath){
    exploredCount++;
    articleProgress.articleFiles.push(filepath);
  })

  articleExplorer.on('end', function(){
    articleProgress.expected = exploredCount;
    var articleUploader = new Uploader(self.client, articleProgress, self.options.locale);

    articleUploader.on('status.error', function(resultObj){
      self.emit('status.error', resultObj);
    })

    self.emit('data.fileExplored', articleProgress);
    articleUploader.start();
  })


  articleExplorer.start(function() {
    articleExplorer.emit('end');
  })
}

Explorer.prototype.explore = function explore(folderPath, isNeeded, callback) {
  var files = fs.readdirSync(folderPath);
  for(var index in files) {
    var fileOrDirectory = path.join(folderPath, files[index]);
    if(fs.statSync(fileOrDirectory).isDirectory()){
      this.explore(fileOrDirectory, isNeeded)
    } else if (fs.statSync(fileOrDirectory).isFile()){
      if(isNeeded(fileOrDirectory)){
        this.emit('data', fileOrDirectory);
      }
    } else {
      //simply ignore others
    }
  }

  if(callback) {
    callback(null);
  }
}

Explorer.prototype.start = function(callback) {
  this.explore(this.folderPath, this.isValidFile, callback);
}

Uploader.prototype.start = function(){
  var self = this;
  var fileTranslations = _createTranslationObjects (this.articleProgress.articleFiles, this.locale);

  for(var index in fileTranslations) {

    (function(index) {
      var fileTranslation = fileTranslations[index];

      self.client.articles.show(fileTranslation.articleId, function(err, code, res) {
        if(err){
           if(err.statusCode == 404)
             self.emit('status.error', {id: fileTranslation.articleId, reason: 'Article not found', err: err});
          else
             self.emit('status.error', {id: fileTranslation.articleId, err: err});
        }
        else {
          self.client.translations.show(fileTranslation.articleId, self.locale, function(err, code, res){
            if(err){
             self.client.translations.createForArticle(fileTranslation.articleId, fileTranslation, function(err, code, res) {
               if(err)
                self.emit('status.error', {id: fileTranslation.articleId, reason: 'Failed to create translation with locale ' + fileTranslation.locale, err: err})
              })
            }
            else{
              self.client.translations.updateForArticle(fileTranslation.articleId, fileTranslation.locale, fileTranslation, function(err, code, res) {
                if(err)
                  self.emit('status.error', {id: fileTranslation.articleId, reason: 'Failed to updte translation with locale ' + fileTranslation.locale, err: err})
              })
            }
          })
        }
      })
    }(index));

  }



}

function _createTranslationObjects(articleFiles, locale) {
  return _.map(articleFiles, function(filepath) {
    var id = path.basename(filepath, path.extname(filepath)).substring(8),
        fileContent = fs.readFileSync(filepath),
        $ = cheerio.load(fileContent);
    return {
      articleId: id,
      locale: locale,
      title: $('h1').text(),
      body: $('p').text()
    }
  })
}

var isValidArticleFile = function (filename) {
  return path.extname(filename) === '.html';
}

exports.ArticleUploadJob = ArticleUploadJob;