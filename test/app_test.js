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


    //test to be sure the server is running.
    it('should be listening at ' + host, function(done){
        http.get(host, function(res) {
            console.log(res.statusCode)
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    //test the function with the given code and title
    function testCodeAndTitle(url, statusCode, title)
    {
        it('should have status code: '+statusCode, function(done) {
            http.get(host + url,function(res){
                assert.equal(res.statusCode,statusCode);
                var body = "";
                res.on('data', function(data) {body += data;});
                res.on('end', function() {
                    assert.equal(res.statusCode, statusCode);
                    var resTitle = body.split("<title>")[1].split("</title>")[0];
                    assert.equal(resTitle,title);
                    done();
                });
                res.on('err', function(err){done(err);});
            });

        });
    }

    //all the routs that need to be tested
    [
        ['/challenge',200,"Challenge Page"],
        ['/scoreboard',200,"Scoreboard page"],
        ['/login',200,"Login"],
        ['/logout',200,""],
        ['/register',200,"Register Here"],
        ['/foobar',404,""],
        ['/',200, "Home Page"]
    ].forEach(function(spec){
        testCodeAndTitle(spec[0],spec[1],spec[2]);
    });


});