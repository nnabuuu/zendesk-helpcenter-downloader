var app = angular.module('Downloader', [])

app.factory('socket', function($rootScope) {
  var socket = io.connect('/');
  return {
    on: function(eventName, callback) {
      socket.on(eventName, function(){
        var args = arguments;
        $rootScope.$apply(function(){
          callback.apply(socket,args);
        })
      })
    }
    , emit: function(eventName, data, callback) {
      socket.emit(eventName, data, function() {
        var args = arguments;
        $rootScope.$apply(function(){
          if(callback) {
            callback.apply(socket, args);
          }
        })
      })
    }
  }
})

app.controller('DownloaderController', function($scope, socket){
  $scope.createNewJob = function() {
    console.log('create new job');
    socket.emit('createNewJob');
  }
})