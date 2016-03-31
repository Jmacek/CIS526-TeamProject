"use strict";
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    socket = require('socket.io'),
    io = socket(http);

app.use(express.static('public'));

var socketArr = [];

io.on('connection', function(socket)  {

  socketArr.push(socket)

  var id = '';
  for(var propertyName in this.connected) {
    id=propertyName;
  }
  var clientIP = this.connected[id].client.conn.remoteAddress;
  console.log("(IPv6) ",clientIP,"connected");

  socket.on('disconnect', function() {console.log(clientIP," disconnected")});

  socket.on('text_change', function(msg){
    //console.log(this);
    var boxID = msg[0];
    var text = msg[1];
    console.log(boxID,'changed to:', text);
    socketArr.forEach(function(elem, index, arr){elem.emit('text_change', msg)});
    //io.emit('text_change', msg);8
  });
});

http.listen(8080, function(){console.log("listening on port 8080...")});
