var util = require('util')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('ArticleSaver');

var ArticleSaver = function ArticleSaver() {
  logger.debug('Inited a new saver: ' + this.constructor.name);
}

util.inherits(ArticleSaver, EventEmitter);

ArticleSaver.prototype.process = function(article, outputPath, callback){
  var savePath = path.join(outputPath, 'category_'+article.parent.parent.id, 'section_' + article.parent.id);
  mkdirp(savePath, null, function(err){
    if(err) {
      logger.error('Failed to create folder path: ' + savePath);
      callback(err);
    }
    else{
      //Begin to save the file
      var filePath = path.join(savePath, 'article_' + article.id +'.html');
      var content = '<h1>' + article.title + '</h1>\n' + article.body;
      fs.writeFile(filePath,content, function(err){
        if(err){
          logger.error('Failed to write file: ' + filePath);
          callback(err);
        }
        else{
          logger.info('Save file '+filePath + ' succeed.');
          callback(null, filePath);
        }
      } )
    }
  });



}

exports.ArticleSaver = ArticleSaver;
