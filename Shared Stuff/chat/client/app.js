var $ = require('jquery'),
    io = require('./socket.io-1.4.5');

$(function(){
  var socket = io();

  // Send message to chat server
  $('#chat-form').submit(function(event){
    event.preventDefault();
    socket.emit('chat message', $('#chat-message').val());
      $('#chat-message').val('');
      return false;
  });

  // Recieve message from chat server
  socket.on('chat message', function(msg) {
    $('#chat-messages').append($('<li>').text(msg));
  });

});
