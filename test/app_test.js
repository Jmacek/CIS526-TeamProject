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



    it('should be listening at ' + host, function(done){
        http.get(host, function(res) {
            console.log(res.statusCode)
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    function testStatusCode(url, statusCode)
    {
        it('should have status code: '+statusCode, function(done) {
            http.get(host + url,function(res){
                //console.log("codes:",res.statusCode,statusCode);
                assert.equal(res.statusCode,statusCode);
                done();
            });

        });
    }

    [
        ['/challenge',200],
        ['/scoreboard',200],
        ['/login',200],
        ['/logout',200],
        ['/register',200],
        ['/foobar',404],
        ['/',200]
    ].forEach(function(spec){
        testStatusCode(spec[0],spec[1])
    });


});