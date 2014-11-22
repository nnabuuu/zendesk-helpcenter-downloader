var util = require('util')
  , Job = require('./job.js').Job
  , GlobalQuerier = require('../querier/globalQuerier').GlobalQuerier
  , CategoryQuerier = require('../querier/categoryQuerier').CategoryQuerier
  , SectionQuerier = require('../querier/sectionQuerier').SectionQuerier
  , StatusSolver = require('../status/statusSolver').StatusSolver
  , log4js = require('log4js')
  , logger = log4js.getLogger('default')

