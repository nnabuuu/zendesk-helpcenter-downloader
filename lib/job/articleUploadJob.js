var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  Job = require('./job.js').Job,
  status = require('../status/status.js'),
  EventEmitter = require('events').EventEmitter;

/**
 *
 * @param client
 * @param options {path: somePath}
 * @constructor
 */
var ArticleUploadJob = function ArticleUploadJob(client, options) {
  Job.call(this, client, options);
}

var ArticleExplorer = function ArticleExplorer(folderPath, isValidFile){
  this.folderPath = folderPath;
  this.isValidFile = isValidFile;
}

var ArticleUploader = function ArticleExplorer(client, articleProgress){
  self.client = client;
  self.articleProgress = articleProgress;
}

util.inherits(ArticleUploadJob, Job);
util.inherits(ArticleExplorer, EventEmitter);
util.inherits(ArticleUploader, EventEmitter);

ArticleUploadJob.prototype.start = function() {
  var self = this,
    exploredCount = 0,
    articleProgress = {
      expected: 0,
      completed: 0,
      articleFiles: []
    };

  var articleExplorer = self.articleExplorer = new ArticleExplorer(self.options.path, isValidArticleFile);

  articleExplorer.start(function() {
    articleExplorer.emit('end');
  })

  articleExplorer.on('data', function(filepath){
    exploredCount++;
    articleProgress.articleFiles.push(filepath);
  })

  articleExplorer.on('end', function(){
    articleProgress.expected = exploredCount;
    var articleUploader = new ArticleUploader(self.client, articleProgress);
    articleUploader.start();
  })


}

ArticleExplorer.prototype.explore = function explore(folderPath, isNeeded, callback) {
  var files = fs.readdirSync(folderPath);
  console.log(files);
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

ArticleExplorer.prototype.start = function(callback) {
  this.explore(this.folderPath, this.isValidFile, callback);
}

ArticleUploader.prototype.start = function(){

}

var isValidArticleFile = function (filename) {
  return path.extname(filename) === '.html';
}

exports.ArticleUploadJob = ArticleUploadJob;