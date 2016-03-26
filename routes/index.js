var express = require('express');
var router = express.Router();

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
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register Here' });
});
module.exports = router;
