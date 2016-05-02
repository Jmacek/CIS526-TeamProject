/**
 * Created by Matt on 5/1/2016.
 */
process.env.NODE_ENV = 'test';


var http = require('http'),
    assert = require('assert'),
    fs = require('fs'),
    url = require('url'),
    config = require('../config/websocket_test'),
    io = require('socket.io'),
    ioClient = require('socket.io-client'),
    gameController = require('../Websocket/gameController.js'),
    ioServer;

global.challenges = JSON.parse(fs.readFileSync('./database/challenges2.json', 'utf8'));


var testSetup = function(done){
    ioServer = io.listen(config.port);
    ioServer.on('connection', gameController.connect, gameController.functions);
    done();
};

var testCleanup = function(done){
    ioServer.close();
    done();
};

var extendEvents= function(socket){
    var onevent = socket.onevent;
    socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);    // original call
        packet.data = ["*"].concat(args);
        onevent.call(this, packet);      // additional call to catch-all
    };
};

var serverTests = function(){
    //start up the Websocket server to be used in the tests
    beforeEach(function(done){
        testSetup(done);
    });

    afterEach('shutting down server..',function(done){
        testCleanup(done);
    });


    it('Websocket server started on port '+config.port, function(done) {
        assert.ok(ioServer);
        done();
    });


    it('Should send "identify" message to newly connected client',function(done){
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        extendEvents(player1);

        player1.on("*",function(event,data) {
            assert.equal('identify',event);
            player1.disconnect();
            done();
        });

    });

    it('Should receive correct name on player identification',function(done){
        ioServer.on('connection',function(socket) {
            socket.on('identity', function (name) {
                player1.disconnect();
                assert.equal(name, 'P1');
                done()
            });
        });
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        player1.on('connect',function(){
            //identify self to server
            player1.emit('identity','P1');
        });
    });

    it('Should increment wait when only one player is connected',function(done){
        ioServer.on('connection',function(socket) {
            socket.on('identity', function (name) {
                var len = gameController.data.waitQueue.length;
                player1.disconnect();
                assert.equal(1, len);
                done();
            });
        });
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        player1.on('connect',function(){
            //identify self to server
            player1.emit('identity','P1');
        });
    });

    it('Should start the game when two players connect',function(done){
        testCleanup(function(){
            var oldFunction = gameController.functions.createGame;
            gameController.functions.createGame = function(player1,player2){
                gameController.functions.createGame = oldFunction;
                assert.ok(1);
                done();
            };
            testSetup(function(){
                var player1 = ioClient.connect(config.serverURL,config.clientOptions);
                player1.on('connect',function(){
                    //identify self to server
                    player1.emit('identity','P1');
                    //connect second player to server
                    var player2 = ioClient.connect(config.serverURL,config.clientOptions);
                    player2.on('connect',function(){
                        //identify self to server
                        player2.emit('identity','P2');
                    });
                });
            });
        });
    });

    //checks that server sends match_set and score messages
    it('Should send match_set and score messages once game is started',function(done){
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        var count = 0;

        player1.on('identify',function(){
            extendEvents(player1);
            //identify self to server
            player1.emit('identity','P1');
            //connect second player to server
            var player2 = ioClient.connect(config.serverURL,config.clientOptions);
            player2.on('identify',function(){
                extendEvents(player2);
                //identify self to server
                player2.emit('identity','P2');
                var checkEvent = function(event,who){
                    if (event == 'match_set' || event == 'score')
                        count += 1;
                    else
                        assert.fail(event,'match_set or score (from '+who+')', undefined, '!==');
                    if (count >= 4){
                        assert.ok(1);
                        player1.disconnect();
                        player2.disconnect();
                        done();
                    }
                };

                player1.on("*",function(event) {
                    checkEvent(event,'p1');
                });
                player2.on('*', function(event){
                    checkEvent(event,'p2');
                });
            });
        });
    });

    //checks catch message sending
    it('Should send "catch" messages to opponents',function(done){
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        player1.on('catch',function(msg){
            assert.equal(msg,'test catch');
            done();
        });
        player1.on('connect',function(){
            //identify self to server
            player1.emit('identity','P1');
            //connect second player to server
            var player2 = ioClient.connect(config.serverURL,config.clientOptions);
            player2.on('connect',function(){
                //identify self to server
                player2.emit('identity','P2');
                //Server sends match_set and score when the match begins
                player2.on('score',function(m){
                    //send catch message
                    player2.emit('catch','test catch');
                })
            });
        });
    });

    //checks caught message sending
    it('Should send "caught" messages to opponents',function(done){
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        player1.on('caught',function(msg){
            assert.equal(msg,'test caught');
            done();
        });
        player1.on('connect',function(){
            //identify self to server
            player1.emit('identity','P1');
            //connect second player to server
            var player2 = ioClient.connect(config.serverURL,config.clientOptions);
            player2.on('connect',function(){
                //identify self to server
                player2.emit('identity','P2');
                //Server sends match_set and score when the match begins
                player2.on('score',function(m){
                    //send catch message
                    player2.emit('caught','test caught');
                })
            });
        });
    });

    it('Should send "score" to sender of "new_text"', function(done){
        var m = {'first':{'id':'test id1','text':'test text1'},'second':{'id':'test id2','text':'test text2'}};
        var count = 0;
        testCleanup(function(){
            var oldFunction = gameController.functions.GoThroughSuperlist;
            gameController.functions.GoThroughSuperlist = function(a,b,c){
                return a; //m.second.id
            };
            testSetup(function(){
                var player1 = ioClient.connect(config.serverURL,config.clientOptions);
                player1.on('connect',function(){
                    //identify self to server
                    player1.emit('identity','P1');
                    //connect second player to server
                    var player2 = ioClient.connect(config.serverURL,config.clientOptions);
                    //identify self to server
                    player2.emit('identity','P2');
                    player2.on('score',function(s){
                        //first "score" message is for setting up the game
                        if (count == 0){
                            count += 1;
                            //the sender of new_text is the one listening for score
                            player2.emit('new_text',m);
                        }
                        //second "score" message is the response from new_text
                        else{
                            gameController.functions.GoThroughSuperlist = oldFunction;
                            assert.equal(s,m.second.id);
                            player1.disconnect();
                            player2.disconnect();
                            done();
                        }
                    });
                });
            });
        });
    });

    it('Should send "score" to opponent of sender of "new_text"', function(done){
        var m = {'first':{'id':'test id1','text':'test text1'},'second':{'id':'test id2','text':'test text2'}};
        var count = 0;
        testCleanup(function(){
            var oldFunction = gameController.functions.GoThroughSuperlist;
            gameController.functions.GoThroughSuperlist = function(a,b,c){
                return a; //m.second.id
            };
            testSetup(function(){
                var player1 = ioClient.connect(config.serverURL,config.clientOptions);
                player1.on('connect',function(){
                    //identify self to server
                    player1.emit('identity','P1');
                    //connect second player to server
                    var player2 = ioClient.connect(config.serverURL,config.clientOptions);
                    //identify self to server
                    player2.emit('identity','P2');
                    player1.on('score',function(s){
                        //first "score" message is for setting up the game
                        if (count == 0){
                            count += 1;
                            //the sender of new_text is the NOT one listening for score (player1 is listening for score in this case)
                            player2.emit('new_text',m);
                        }
                        //second "score" message is the response from new_text
                        else{
                            gameController.functions.GoThroughSuperlist = oldFunction;
                            player1.disconnect();
                            player2.disconnect();
                            assert.equal(s,m.second.id);
                            done();
                        }
                    });
                });
            });
        });
    });

    it('Should send "new_text" to opponent of sender of "new_text"', function(done){
        var m = {'first':{'id':'test id1','text':'test text1'},'second':{'id':'test id2','text':'test text2'}};
        var count = 0;
        testCleanup(function(){
            var oldFunction = gameController.functions.GoThroughSuperlist;
            gameController.functions.GoThroughSuperlist = function(a,b,c){
                return a; //m.second.id
            };
            testSetup(function(){
                var player1 = ioClient.connect(config.serverURL,config.clientOptions);
                player1.on('connect',function(){
                    //identify self to server
                    player1.emit('identity','P1');
                    //connect second player to server
                    var player2 = ioClient.connect(config.serverURL,config.clientOptions);
                    //identify self to server
                    player2.emit('identity','P2');
                    player2.on('score',function(){
                        if (count == 0){
                            count += 1;
                            //sends new_text after game has started
                            player2.emit('new_text',m);
                        }
                    });
                    player1.on('new_text',function(s){
                        var id = s.id;
                        var text = s.text;
                        gameController.functions.GoThroughSuperlist = oldFunction;
                        player1.disconnect();
                        player2.disconnect();
                        assert.equal(id,m.first.id);
                        assert.equal(text,m.first.text);
                        done();
                    });
                });
            });
        });
    });

    it('Should send "game_over" to opponent when a player disconnects"', function(done){
        var player1 = ioClient.connect(config.serverURL,config.clientOptions);
        player1.on('game_over',function(msg){
            assert.ok(1);
            player1.disconnect();
            done();
        });
        player1.on('connect',function(){
            //identify self to server
            player1.emit('identity','P1');
            //connect second player to server
            var player2 = ioClient.connect(config.serverURL,config.clientOptions);
            player2.on('connect',function(){
                //identify self to server
                player2.emit('identity','P2');
                //Server sends match_set and score when the match begins
                player2.on('score',function(m){
                    //player2 disconnects after the game has started
                    player2.disconnect();
                })
            });
        });
    });

    it('Should send "game_over" to both players upon game timeout', function(done){
        var p1count = 0;
        var p2count = 0;
        testCleanup(function(){
            var oldTime = gameController.data.gameTime;
            gameController.data.gameTime = .5;
            testSetup(function(){
                var player1 = ioClient.connect(config.serverURL,config.clientOptions);
                player1.on('connect',function(){
                    //identify self to server
                    player1.emit('identity','P1');
                    //connect second player to server
                    var player2 = ioClient.connect(config.serverURL,config.clientOptions);
                    player2.on('connect',function(){
                        //identify self to server
                        player2.emit('identity','P2');

                        var gameOverCheck = function(){
                            if (p1count == 1 && p2count == 1) {
                                gameController.data.gameTime = oldTime;
                                assert.ok(1);
                                player1.disconnect();
                                player2.disconnect();
                                done();
                            }
                        };
                        player1.on('game_over',function(){
                            p1count +=1;
                            gameOverCheck()
                        });
                        player2.on('game_over',function(){
                            p2count +=1;
                            gameOverCheck()
                        });
                    });
                });
            });
        });
    });
};

var clientTests = function(){

    it('Client should receive "identify message on startup',function(){

    });
};



describe('Websocket tests', function() {

    describe('Websocket-Server tests',serverTests);

});