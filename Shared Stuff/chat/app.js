"use strict";
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    socket = require('socket.io'),
    io = socket(http);

app.use(express.static('public'));

var socketArr = [];

io.on('connection', function(socket)  {

  socketArr.push(socket);
  console.log("A user connected");
  socket.on('disconnect', function() {console.log("A user disconnected")});
  socket.on('text_change', function(msg){
    console.log('A user said', msg);
    socketArr.forEach(function(elem, index, arr){elem.emit('text_change', msg)});
    //io.emit('text_change', msg);8
  })
});

http.listen(8080, function(){console.log("listening on port 80...")});
