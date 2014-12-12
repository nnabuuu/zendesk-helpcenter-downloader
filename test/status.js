var status = require('../lib/status/status.js');
var assert = require('assert');
var data = {};

beforeEach(function(){
  var category = {},
    section1 = {parent: category},
    section2 = {parent: category},
    article1_1 = {parent: section1},
    article1_2 = {parent: section1},
    article2_1 = {parent: section2};

  category.sections = [section1, section2];
  section1.articles = [article1_1, article1_2];
  section2.articles = [article2_1];

  status.category.init(category);
  status.section.init(section1);
  status.section.init(section2);
  status.article.init(article1_1);
  status.article.init(article1_2);
  status.article.init(article2_1);

  data = {
    category: category,
    section1: section1,
    section2: section2,
    article1_1: article1_1,
    article1_2: article1_2,
    article2_1: article2_1
  }
})

describe('status', function () {
  describe('general', function () {
    it('should contains a category as an object', function () {
      assert.equal(typeof(status.category), 'object');
    });
    it('should contains a section as an object', function () {
      assert.equal(typeof(status.section), 'object');
    });
    it('should contains an article an object', function () {
      assert.equal(typeof(status.article), 'object');
    });
  });

  describe('init', function(){
    it('should grant object meta data', function () {
      assert.notEqual(data.category.metaData, undefined);
    })
  })

  describe('update', function(){
    it('should not effect process status', function() {
      data.category.metaData.status.process = status.ProcessStatus.NOT_STARTED;

      status.category.update(data.category, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.process, status.ProcessStatus.NOT_STARTED);
    })

    it('should not effect parent process status', function() {
      data.category.metaData.status.process = status.ProcessStatus.NOT_STARTED;
      data.section1.metaData.status.process = status.ProcessStatus.NOT_STARTED;

      status.section.update(data.section1, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.process, status.ProcessStatus.NOT_STARTED);
    })

    it('should change result status', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.update(data.category, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.FAIL);
    })

    it('should change parent result status if set to FAIL', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;
      data.section1.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.update(data.section1, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.FAIL);
    })

    it('should not change parent result status if set to PASS', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;
      data.section1.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.update(data.section1, status.ResultStatus.PASS);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.UNKNOWN);
    })

    it('should return false if process already completed', function() {
      data.category.metaData.status.process = status.ProcessStatus.COMPLETED;

      var executeResult = status.category.update(data.category, status.ResultStatus.FAIL);

      assert.equal(executeResult, false);
    })

    it('should return true if process not completed', function() {
      data.category.metaData.status.process = status.ProcessStatus.NOT_STARTED;

      var executeResult = status.category.update(data.category, status.ResultStatus.FAIL);

      assert.equal(executeResult, true);
    })
  })

  describe('complete', function(){
    it('should change process status', function() {
      data.category.metaData.status.process = status.ProcessStatus.NOT_STARTED;

      status.category.complete(data.category, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.process, status.ProcessStatus.COMPLETED);
    })

    it('should not take any effect if process already completed', function() {
      data.category.metaData.status.process = status.ProcessStatus.COMPLETED;

      var executeResult = status.category.complete(data.category, status.ResultStatus.FAIL);

      assert.equal(data.category.metaData.status.result, status.ResultStatus.UNKNOWN);
    })

    it('should return false if process already completed', function() {
      data.category.metaData.status.process = status.ProcessStatus.COMPLETED;

      var executeResult = status.category.complete(data.category, status.ResultStatus.FAIL);

      assert.equal(executeResult, false);
    })

    it('should return true if process not completed', function() {
      data.category.metaData.status.process = status.ProcessStatus.NOT_STARTED;

      var executeResult = status.category.complete(data.category, status.ResultStatus.FAIL);

      assert.equal(executeResult, true);
    })

    it('should change result status', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.complete(data.category, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.FAIL);
    })

    it('should change parent result status if set to FAIL', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;
      data.section1.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.complete(data.section1, status.ResultStatus.FAIL);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.FAIL);
    })

    it('should not change parent result status if set to PASS', function() {
      data.category.metaData.status.result = status.ResultStatus.UNKNOWN;
      data.section1.metaData.status.result = status.ResultStatus.UNKNOWN;

      status.section.complete(data.section1, status.ResultStatus.PASS);
      assert.equal(data.category.metaData.status.result, status.ResultStatus.UNKNOWN);
    })
  })

})