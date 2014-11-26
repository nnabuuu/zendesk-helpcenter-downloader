var express = require('express')
var app = express()
var port = process.env.PORT || 3000

var ArticleDownloadJob = require('./lib/job/articleDownloadjob').ArticleDownloadJob
  , client = require('node-zendesk').createClient({
    username: 'zjsnxc@gmail.com'
    , password: '11223344'
    , subdomain: 'testbyx'
    , helpcenter: true
  }), log4js = require('log4js')
log4js.configure('./log4js.json', {});

app.use(express.static(__dirname + '/static'))

app.use(function(req, res) {
  res.sendFile('/index.html')
})

var io = require('socket.io').listen(app.listen(port))
io.set('INFO', false)

io.sockets.on('connection', function(socket) {
  console.log("Connected");
  socket.emit('connected');

  socket.on('createNewJob', function(someInfo){
    console.log("Recevied: Create New Job!");
    var articleDownloadJob = new ArticleDownloadJob(client, {zip: true});
    articleDownloadJob.process();

    articleDownloadJob.on('statusChange', function(obj){
      console.log('emitting statusChange');
      if(obj.processStatus == 'notStarted' && obj.resultStatus == 'unknown') {
        if(obj.isCategory){
          socket.emit('newCategory', {id: obj.id, name: obj.name, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }
        else if(obj.isSection){
          socket.emit('newSection', {parentId: obj.parent.id, id: obj.id, name: obj.name, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }else if(obj.isArticle){
          socket.emit('newArticle', {parentId: obj.parent.id, id: obj.id, name: obj.name, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }
        else{
          console.error('Unknown type: ' + obj);
        }
      }
      else{
        if(obj.isCategory){
          socket.emit('categoryStatusChange', {id: obj.id, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }else if(obj.isSection){
          socket.emit('sectionStatusChange', {parentId: obj.parent.id, id: obj.id, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }else if(obj.isArticle){
         socket.emit('articleStatusChange', {parentId: obj.parent.id, id: obj.id, processStatus: obj.processStatus, resultStatus: obj.resultStatus});
        }
        else{
          console.error('Unknown type: ' + obj);
        }
      }

    })

    articleDownloadJob.on('end', function(result){
      console.log('article job success! Emitting article-zip');
      socket.emit('article-zip', result.zip.toBuffer().toString('base64'));
    })
  })

})

