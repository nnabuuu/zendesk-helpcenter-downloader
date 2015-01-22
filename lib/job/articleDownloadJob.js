var util = require('util'),
  Job = require('./job.js').Job,
  ArticleSaver = require('../saver/articleSaver.js').ArticleSaver,
  AdmZip = require('adm-zip'),
  status = require('../status/status.js'),
  Q = require('Q'),
  _ = require('lodash'),
  schema = require('../database/schema.js');

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
    zip = new AdmZip;

  self.categories = [];
  self.sections = [];
  self.articles = [];
  self.translations = [];

  var categoryPromise = function spawn_category_promise(){
    return self.storeJob()
      .then(function store_job_id(jobId) {
        self.id = jobId;
        console.log("Create job id: " + self.id);
      })
      .then(self.query_categories.bind(self))
      .then(self.store_categories_into_job.bind(self))
  }();

  //Store all categories into database
  categoryPromise.then(self.store_categories_into_database.bind(self))
    .done(self.show_categories_database_storage_result.bind(self), console.error);

  //Query all sections under categories
  var sectionPromise = function spawn_section_promise(categoryPromise) {
    return categoryPromise.then(self.query_all_sections.bind(self))
      .then(filter_fulfilled_promises_value_into_flatten)
      .then(self.store_sections_into_job.bind(self))
  }(categoryPromise);

  //Store all sections into database
  sectionPromise.then(self.store_sections_into_database.bind(self))
    .done(self.show_sections_database_storage_result.bind(self), console.error);

  //Query all articles under sections
  var articlePromise = function spawn_article_promise(sectionPromise) {
    return sectionPromise.then(self.query_all_articles.bind(self))
      .then(filter_fulfilled_promises_value_into_flatten)
      .then(self.store_articles_into_job.bind(self))
  }(sectionPromise);

  //Store all articles into database
  articlePromise.then(self.store_articles_into_database.bind(self))
    .done(self.show_articles_database_storage_result.bind(self), console.error);

  //Query and Store translations if specified
  if(self.options.locale) {
    var translationPromise = function spawn_translation_promise(articlePromise) {
      return articlePromise.then(function (articles) {
        return self.query_all_translations(articles, self.options.locale);
      })
        .then(filter_fulfilled_promises_value_into_flatten)
        .then(self.store_translations_into_job.bind(self))
    }(articlePromise);

    translationPromise.then(function (translations) {
      return self.store_translations_into_database(translations);
    })
      .done(self.show_translations_database_storage_result.bind(self), console.error);
  }
}


//Argument:
ArticleDownloadJob.prototype.query_categories = create_query_under_function('categories', 'list');
//Argument: categoryId
ArticleDownloadJob.prototype.query_sections_under_category = create_query_under_function('sections', 'listByCategory');
//Argument: sectionId
ArticleDownloadJob.prototype.query_article_under_section = create_query_under_function('articles', 'listBySection');
//Arguments: articleId, {locale: 'locale'}
ArticleDownloadJob.prototype.query_translation_for_article = create_query_under_function('translations', 'listByArticle');

function create_query_under_function(type, list_function_name){
  return function() {
    var self = this;
    var deferred = Q.defer();

    var args = Array.prototype.slice.call(arguments);
    //Hack Q's implementation
    if(args.length == 1 && args[0] === undefined)
      args = [];

    args.push(function(err, code, objs){
      if(err) deferred.reject(err);
      else deferred.resolve(_.map(objs, function(obj){
        obj.job_id = self.id;
        return obj;
      }));
    });

    self.client[type][list_function_name].apply(self.client[type], args)
    return deferred.promise;
  }
}

ArticleDownloadJob.prototype.query_all_sections = create_query_all_function(ArticleDownloadJob.prototype.query_sections_under_category);
ArticleDownloadJob.prototype.query_all_articles = create_query_all_function(ArticleDownloadJob.prototype.query_article_under_section);
ArticleDownloadJob.prototype.query_all_translations = create_query_all_function (ArticleDownloadJob.prototype.query_translation_for_article);

/*= function(articles, locale) {
 var self = this;
 var promiseArray = _.map(articles, function(article){
 return self.query_translation_for_article(article.id, {locales: locale});
 })
 return Q.allSettled(promiseArray);
 }
 */

function create_query_all_function(func){

  return function(){
    var args = Array.prototype.slice.call(arguments),
      self = this;

    var objects = args.shift();
    var promiseArray = _.map(objects, function(object){
      return func.apply(self, [object.id].concat(args));
    })

    return Q.allSettled(promiseArray);
  }
}



ArticleDownloadJob.prototype.storeJob = function() {
  var deferred = Q.defer();
  var Job = new schema.JobModel();
  Job.type = 'ArticleDownloadJob';
  Job.save(function(err){
    if(err) deferred.reject(err);
    else deferred.resolve(Job.id);
  });
  return deferred.promise;

}

ArticleDownloadJob.prototype.store_categories_into_database = create_store_into_database_function(schema.CategoryModel);
ArticleDownloadJob.prototype.store_sections_into_database = create_store_into_database_function(schema.SectionModel);
ArticleDownloadJob.prototype.store_articles_into_database = create_store_into_database_function(schema.ArticleModel);
ArticleDownloadJob.prototype.store_translations_into_database = create_store_into_database_function(schema.TranslationModel);


function create_store_into_database_function(ModelFunc){
  return function(objs){
    //console.log('objects to save', objs);
    var promiseArray = _.map(objs, function(obj) {
      var deferred = Q.defer(),
        model = new ModelFunc(obj);
      model.save(function(err) {
        if(err) deferred.reject(err);
        else deferred.resolve(obj);
      })
      return deferred.promise;
    })
    return Q.allSettled(promiseArray);
  }
}

ArticleDownloadJob.prototype.store_categories_into_job = create_store_into_job_function("categories");
ArticleDownloadJob.prototype.store_sections_into_job = create_store_into_job_function("sections");
ArticleDownloadJob.prototype.store_articles_into_job = create_store_into_job_function("articles");
ArticleDownloadJob.prototype.store_translations_into_job = create_store_into_job_function("translations");


function create_store_into_job_function(name){
  return function(objects){
    this[name] = this[name].concat(objects);
    console.log('Current', name, ':', this[name]);
    return Q.fcall(function(){return objects});
  }
}

ArticleDownloadJob.prototype.show_categories_database_storage_result = create_show_database_storage_result("categories");
ArticleDownloadJob.prototype.show_sections_database_storage_result = create_show_database_storage_result("sections");
ArticleDownloadJob.prototype.show_articles_database_storage_result = create_show_database_storage_result("articles");
ArticleDownloadJob.prototype.show_translations_database_storage_result = create_show_database_storage_result("translations");

function create_show_database_storage_result(name){
  return function show_database_storage_result(promises){
    console.log(name);
    for(var index in promises) {
      if(promises[index].state === 'fulfilled')
        console.log(name, 'store in database', this[name][index].id + ': succeed');
      else
        console.log(name, 'store in database', this[name][index].id + ': failed. Reason: ' + promises[index].reason);
    }
  }
}

function filter_fulfilled_promises_value_into_flatten(promises) {
  var notFulfilledPromises = _.remove(promises, function (promise) {
    return promise.state !== 'fulfilled';
  })
  var valuesArray = _.map(promises, function (promise) {
    return promise.value;
  })

  return Q.fcall(_.flatten, valuesArray);
}

module.exports.ArticleDownloadJob = ArticleDownloadJob;