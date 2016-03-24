var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/mockup', function(req, res, next) {
  res.render('mockup', { title: 'Mockup Page' });
});

module.exports = router;
