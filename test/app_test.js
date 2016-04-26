/**
 * Created by gannonhuiting on 4/25/16.
 */
process.env.NODE_ENV = 'test';


var http = require('http'),
    assert = require('assert'),
    fs = require('fs'),
    url = require('url'),
    config = require('../config/test'),
    host = config.host;


before(function() {
    // also, store the app globally
    global.app = require('./../bin/www');
});

describe('app tests', function() {

    it('app should exist', function() {
        assert.ok(app);
    });



    //it('should be listening at ' + host, function(done){
    //    http.get(host, function(res) {
    //        console.log(res.statusCode)
    //        assert.equal(res.statusCode, 404);
    //        done();
    //    });
    //});

    //function testStaticFile(url, path) {
    //    it('should serve ' + url + ' from ' + path, function(done) {
    //        var fileBody = fs.readFileSync(path);
    //
    //        http.get(host + url, function(res) {
    //            assert.equal(res.statusCode, 200);
    //            var body = "";
    //            res.on('data', function(data) {body += data;});
    //            res.on('end', function() {
    //                assert.equal(fileBody, body);
    //                done();
    //            });
    //            res.on('err', function(err) {done(err);});
    //        });
    //    });
    //}
    //
    //[
    //    ['/rides.css', './public/rides.css'],
    //    ['/rides.js', './public/rides.js'],
    //    ['/favicon.ico', './public/favicon.ico']
    //].forEach(function(spec){
    //    testStaticFile(spec[0], spec[1]);
    //});

});