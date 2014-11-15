var util = require('util')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , logger = require('log4js').getLogger('default');

var ArticleSaver = function ArticleSaver() {
  logger.trace('Inited a new saver: ' + this.constructor.name);
}

util.inherits(ArticleSaver, EventEmitter);

/**
 * Save article to outputPath
 * @param article
 * @param outputPath
 * @param callback
 */
ArticleSaver.prototype.save = function(/*Object*/article, /*String*/outputPath, /*Function*/callback){
  if(!article || !outputPath) {
    callback(new Error('Null article or output path'));
    return;
  }
  if(!article.id || !article.title || !article.body) {
    callback(new Error('Incomplete article information, need id, title and body'));
    return;
  }
  logger.debug('Begin to query article ' + article.id);
  var savePath = path.join(outputPath, 'category_'+article.parent.parent.id, 'section_' + article.parent.id);
  logger.debug('Checking folder path: '+ savePath);
  mkdirp(savePath, null, function(err){
    if(err) {
      logger.error('Failed to create folder path: ' + savePath);
      callback(err, article);
    }
    else{
      //Begin to save the file
      var filePath = path.join(savePath, 'article_' + article.id +'.html');
      logger.debug('Saving article as ' + filePath);
      var content = '<h1>' + article.title + '</h1>\n' + article.body;
      //logger.trace('Content of article ' + article.id + '\n' + content);
      fs.writeFile(filePath,content, function(err){
        if(err){
          logger.error('Failed to write file: ' + filePath);
          callback(err);
        }
        else{
          logger.info('Save file '+filePath + ' succeed.');
          callback(null, article);
        }
      } )
    }
  });

}

exports.ArticleSaver = ArticleSaver;
