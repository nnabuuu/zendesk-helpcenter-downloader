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

io.sockets.on('connection', function(socket) {
  console.log("Connected");
  socket.emit('connected');

  socket.on('createNewJob', function(someInfo){
    console.log("Recevied: Create New Job!");
    var articleDownloadJob = new ArticleDownloadJob(client, {zip: true});
    articleDownloadJob.process();
    articleDownloadJob.on('end', function(result){
      console.log('article job success! Emitting article-zip');
      socket.emit('article-zip', result.zip.toBuffer().toString('base64'));
    })
  })

})

