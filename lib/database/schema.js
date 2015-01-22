var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/zendesk');

/**
 * AutoIncrement: A hack implementation of auto-increment on job id
 * @type {mongoose.Schema}
 */

var AutoIncrementSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  nextSeqNumber: { type: Number, default: 1 }
}, {
  collection: 'autoincrement'
});

var AutoIncrementModel = module.exports.AutoIncrementModel = mongoose.model('AutoIncrementModel', AutoIncrementSchema);


/**
 * Job
 * @type {mongoose.Schema}
 */
var JobSchema = new mongoose.Schema({
  id: Number,
  type: String,
  begin_at: Date,
  end_at: Date,
  status: Number,
  entry_point: [{type: String, ref: 'Category'}]
}, {
  collection: 'jobs'
});

/**
 * Before saving any job, fetch a SeqNumber from autoincrement collection.
 * There should already be an item {name: 'JobID'} in autoincrement collection, which is guaranteed by startup check.
 */
JobSchema.pre('save', function(next) {
  var job = this;
  AutoIncrementModel.findOneAndUpdate( {name: 'JobID'}, { $inc: { nextSeqNumber: 1 } }, function (err, autoincrement) {
    if (err) {
      next(err);
    }
    else {

      job.id = autoincrement.nextSeqNumber - 1; // Substract 1 because we need the 'current' sequence number, not the next
      next();
    }
  });
});

var JobModel = module.exports.JobModel = mongoose.model('Job', JobSchema);


/**
 * Category: a top-leveled Zendesk help-center item.
 * A category may contains 0 or more sections.
 * @type {mongoose.Schema}
 */
var CategorySchema = new mongoose.Schema({
  id: String,
  url: String,
  html_url: String,
  position: Number,
  created_at: Date,
  updated_at: Date,
  name: String,
  description: String,
  locale: String,
  source_locale: String,
  outdated: Boolean,
  //===
  job_id: Number
}, {
  collection: 'categories'
});

var CategoryModel = module.exports.CategoryModel = mongoose.model('Category', CategorySchema);

/**
 * Section: a second-level Zendesk help-center item.
 * A section must belong to some category.
 * A section may contains 0 or more articles.
 * @type {mongoose.Schema}
 */
var SectionSchema = new mongoose.Schema({
  id: String,
  url: String,
  html_url: String,
  category_id: String,
  position: Number,
  created_at: Date,
  updated_at: Date,
  name: String,
  description: String,
  locale: String,
  source_locale: String,
  outdated: Boolean,
  //==
  job_id: Number
}, {
  collection: 'sections'
});

var SectionModel = module.exports.SectionModel = mongoose.model('Section', SectionSchema);


/**
 * Article: a bottom level Zendesk help-center item.
 * An article must belong to some section
 * @type {mongoose.Schema}
 */
var ArticleSchema = new mongoose.Schema({
  id: String,
  url: String,
  html_url: String,
  author_id: String,
  comments_disabled: Boolean,
  label_names: [String],
  draft: Boolean,
  promoted: Boolean,
  position: Number,
  vote_sum: Number,
  vote_count: Number,
  section_id: String,
  created_at: Date,
  updated_at: Date,
  name: String,
  title: String,
  body: String,
  locale: String,
  source_locale: String,
  outdated: Boolean,
  //===
  job_id: Number
}, {
  collection: 'articles'
});

var ArticleModel = module.exports.ArticleModel = mongoose.model('Article', ArticleSchema)

var TranslationSchema = new mongoose.Schema({
  id: String,
  url: String,
  source_id: String,
  source_type: String,
  locale: String,
  title: String,
  body: String,
  outdated: Boolean,
  draft: Boolean,
  hidden: Boolean,
  created_at: Date,
  updated_at: Date,
  //===
  job_id: Number
}, {
  collection: 'translations'
});


var TranslationModel = module.exports.TranslationModel = mongoose.model('Translation', TranslationSchema)