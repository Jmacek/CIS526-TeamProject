/**
 * Created by Matt on 4/1/2016.
 */

var gameIDArr = {}; //matches sockets to gameIDs
var gameArr = {};//matches gameIDs to players tuple (socketID,playername) for both players and timeout object
var waitQueue = [];
var socketArr={};//matches sockets to socketIDs
var playerArr = [];//matches players to socketIDs

var gameTime = 120;//length of game (in.. milliseconds?)

//where a given socket
function connect(socket) {

    var id = '';
    for (var propertyName in this.connected) {
        id = propertyName;
    }
    var clientIP = this.connected[id].client.conn.remoteAddress;
    console.log("(IPv6) ", clientIP, "connected");

    //socket.emit("set_self",)

    socket.on('disconnect', function () {
        console.log(clientIP, " disconnected");
        //remove from socketArr
        if(socket.id in gameIDArr){
            var gameID = lookupGameID(socket.id);
            var opponent = lookupOpponent(socket.id);
            delete gameIDArr[socket.id];
            var gameTuple = lookupGame(gameID);
            clearTimeout(gameTuple.timeout);
            opponent.emit('game_over','forfeit');
            //TODO: if game in GameArr, then forefit
        }
        else{
            //remove from waitQueue if in there
            var index = waitQueue.indexOf(socket.id);
            //console.log("Before waitQueue =",waitQueue);
            if (index > -1) {
                waitQueue.splice(index, 1);
            }
            //console.log("After waitQueue =",waitQueue);
        }
        delete socketArr[socket.id];
        delete playerArr[socket.id];
    });

    socket.on('match',function(m){
        var opponent = lookupOpponent(socket.id);
        if(opponent !== null)
            opponent.emit('match', m);
    });

    socket.on('catch',function()
    {
        var opponent = lookupOpponent(socket.id);
        if(opponent !== null)
            opponent.emit('catch');
    });

    socket.on('identity',function(playerName){
        //TODO: form reset upon connect
        socketArr[socket.id]=socket;
        playerArr[socket.id]=playerName;
        var player = {socketID:socket.id,playerName:playerName};
        //console.log("Current waitQueue =",waitQueue);
        //console.log("waitQueue.length % 2 =",waitQueue.length % 2);
        if(waitQueue.length % 2 == 0){
            waitQueue.push(player.socketID);
        }
        else{
            var player1ID = waitQueue.shift();
            var player1 = {socketID:player1ID,playerName:lookupPlayer(player1ID)};
            var player2 = player;
            createGame(player1,player2);
        }
    });

    socket.on('text_change', function (msg) {
        var boxID = msg[0];
        var text = msg[1];
        //console.log(boxID, 'changed to:', text);
        //console.log("recieved change from socket " + socket.id);
        var opponent = lookupOpponent(socket.id);
        if (opponent !== null) {
            //console.log("Sending change to "+opponent.id);
            opponent.emit('text_change', msg);
        }
        //io.emit('text_change', msg);8
    });

    socket.emit('identify');
}
//socket is the client socket that we are sending the update to
//players is the object {Player1:"name1",Player2:"name2"} identifying
function sendGameOver(gameID,msg){
    console.log("sending gameOver");
    var gameTuple = lookupGame(gameID);
    S1 = lookupSocket(gameTuple.player1.socketID);
    S2 = lookupSocket(gameTuple.player2.socketID);
    S1.emit('game_over',msg);
    S2.emit('game_over',msg);
}

function createGame(player1,player2){
    var challenges = [];

    challenges[0] = "This is challenge 1";
    challenges[1] = "This is challenge 2";
    challenges[2] = "This will be challenge 3";

    var gameID;
    do{
        gameID = randomInt(0,10000);
    }while(gameID in gameArr);

    gameIDArr[player1.socketID] = gameID;
    gameIDArr[player2.socketID] = gameID;

    console.log("player1 socketID = "+player1.socketID);
    console.log("player2 socketID = "+player2.socketID);

    var timeoutObj = setTimeout(sendGameOver,gameTime*1000,gameID);
    var gameTuple = {player1:player1,player2:player2,timeout:timeoutObj};

    gameArr[gameID]=gameTuple;

    var matchup = {player1:player1.playerName,player2:player2.playerName};
    sendMatchup(gameTuple,matchup,gameTime);
    sendChallenges(gameTuple,challenges)
}

function lookupSocket(socketID){
    if(socketID in socketArr)
        return socketArr[socketID];
    else
        console.log("SocketID not in socketArr!");
    return null
}

function lookupPlayer(socketID){
    if(socketID in playerArr)
        return playerArr[socketID];
    else
        console.log("SocketID not in playerArr!");
    return null
}

function lookupGameID(socketID){
    if(socketID in gameIDArr)
        return gameIDArr[socketID];
    else
        console.log("SocketID not in gameIDArr!"+ JSON.stringify(gameIDArr));
    return null
}

function lookupGame(gameID){
    if(gameID in gameArr)
        return gameArr[gameID];
    else
        console.log(gameID, "not in gameArr!",gameArr);
    return null
}

function lookupOpponent(socketID){
    var gameID = lookupGameID(socketID);
    if(gameID === null)
        return null;
    var game = lookupGame(gameID);
    firstPlayer = game['player1'].socketID;
    if (socketID == firstPlayer)
        return lookupSocket(game['player2'].socketID);
    else
        return lookupSocket(firstPlayer);
}

//Sends the matchup for the game to the players in the form of:
//{player1:"name",player2:"name"}
function sendMatchup(gameTuple,matchup,time){
    S1 = lookupSocket(gameTuple.player1.socketID);
    S2 = lookupSocket(gameTuple.player2.socketID);
    console.log("Setting players: ",matchup);
    S1.emit('match_set',{players:matchup,number:1,time:time});
    //console.log("Socket ID "+S1.id+" is set as first player");
    S2.emit('match_set',{players:matchup,number:2,time:time});//reversed the 2 and 1 somewhere
}

function sendChallenges(gameTuple,challenges){
    S1 = lookupSocket(gameTuple.player1.socketID);
    S2 = lookupSocket(gameTuple.player2.socketID);
    S1.emit('challenge_set',challenges);
    S2.emit('challenge_set',challenges);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

module.exports = exports = connect;