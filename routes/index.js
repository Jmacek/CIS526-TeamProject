var express = require('express');
var router = express.Router();
var encryption = require('../authentication/encryption');
var db = require('../database/db');

var session = require('./session');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home Page' });
});
router.get('/mockup', function(req, res, next) {
  res.render('mockup', { title: 'Mockup Page' });
});
router.get('/challenge', function(req, res, next) {
  res.render('challenge', { title: 'Challenge Page' });
});
router.get('/scoreboard', function(req, res, next) {
  res.render('scoreboard', { title: 'Scoreboard page' });
});
router.get('/login', session.new);
router.post('/login',session.create);

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register Here',pubKey:encryption.servePublicKey() });
});

router.post('/register', function(req, res){
  req.session.reset();
  //console.log('in create');
  //console.log(req.body);
  var encrypted = req.body.encrypted;
  //console.log('encrypted = ',encrypted);
  var decrypted = encryption.asymDecrypt(encrypted);
  console.log(decrypted);

  var salt = encryption.salt();
  var hash = encryption.hash(decrypted.password,salt);

  if(!/^[a-z0-9_-]{3,15}$/.test(decrypted.username)){
    return res.render('register', { title: 'Register Here', invalid: true, message:'Username must be 3 to 15 characters long and only comprise of alphabetic letters & numbers'});
  }
  if(decrypted.username != "Guest"){ //I know, I'm a bad person for lying.
    return res.render('register', { title: 'Register Here', invalid: true, message:'Name already exists. Please choose a different username'});
  }

  db.run("INSERT INTO USERS (username,passwordDigest, salt, admin) VALUES (?,?,?,0)",
      decrypted.username, hash, salt, function(err){
          if(err)
            res.render('register', { title: 'Register Here', invalid: true, message:"Name already exists. Please choose a different username", pubKey:encryption.servePublicKey() });
          else
            session.create(req,res);
      });
});

module.exports = router;
