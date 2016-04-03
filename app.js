var express = require('express');
var path = require('path');
var sessions = require('client-sessions');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var encryption = require('./authentication/encryption');
var http = require("http");

var routes = require('./routes/index');
var users = require('./routes/users');
var session = require('./routes/session');

var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);


//Websockets in app.js
io.sockets.on("connection", function(socket) {
  console.log("App.js websockets in  use");
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Enable sessions
app.use(sessions({
  cookieName: 'session',
  secret: encryption.serveSymmKey(),
  duration: 24*60*60*1000,
  activeDuration: 1000*60*5
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//loads the current user in req.session.user
app.use(session.loadUser);

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
