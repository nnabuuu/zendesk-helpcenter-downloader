var util = require('util')
  , Querier = require('./querier').Querier
  , logger = require('log4js').getLogger('default');

var SectionQuerier = function SectionQuerier(client, collector){
  Querier.call(this, client, collector);
};

util.inherits(SectionQuerier, Querier);

SectionQuerier.prototype.query = function(/*Object*/section, /*Function*/callback){
  var self = this
    , sectionId = section.id;

  logger.debug('Begin to query section information, section id: ' + sectionId);
  self.client.articles.listBySection(sectionId, function(err, code, res){
    logger.debug('Return from query section information, section id: ' + sectionId);
    if(err) {
      logger.error('Fail to query section information, section id: ' + sectionId);
      section.articles = []
      callback(err);
    }
    else{
      logger.info('Query section information success, section id: ' + sectionId);
      var articles = section.articles = [];

      for(var index in res) {
        var article = res[index];
        article.parent = section;
        articles.push(article);
      }
      callback(null, articles);
    }
  })
}

exports.SectionQuerier = SectionQuerier;