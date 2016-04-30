/**
 * Created by gannonhuiting on 4/25/16.
 */
process.env.NODE_ENV = 'test';


var    server,
    http = require('http'),
    assert = require('assert'),
    fs = require('fs'),
    url = require('url'),
    config = require('../config/test'),
    host = config.host;


before(function() {
    var app = require('./../bin/www');
    // also, store the app globally
    global.app = app;
});

describe('app tests', function() {

    it('app should exist', function() {
        assert.ok(app);
    });



    it('should be listening at ' + host, function(done){
        http.get(host, function(res) {
            console.log(res.statusCode)
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    //im tired and done with javascripts bs
    function getElement(name, body)
    {
        var p = body.split("<"+name+">");
        var r = p[1].split("</"+name+">")[0];
        return r;
    }

    function HTMLObject(body)
    {
        var output = {
            title: getElement("title",body),
            style: getElement("style",body),
            script: getElement("script",body)
        }
        return output;
    }

    function testStaticFile(url, path) {
        it('should serve ' + url + ' from ' + path, function(done) {
            var fileBody = fs.readFileSync(path, {encoding: "utf-8"});
            http.get(host + url, function(res) {
                assert.equal(res.statusCode, 200);
                var body = "";
                res.on('data', function(data) {body += data;});
                res.on('end', function() {
                var htmlFile = HTMLObject(fileBody);
                var htmlRes = HTMLObject(body);
                assert.equal(htmlFile,htmlRes);
                });
                //res.on('err', function(err) {done(err);});
                done();
            });
        });
    }

    [
        ['/mockup', './public/mockup.html'],
        //['/rides.js', './public/rides.js'],
        //['/favicon.ico', './public/favicon.ico']
    ].forEach(function(spec){
        testStaticFile(spec[0], spec[1]);
    });

});