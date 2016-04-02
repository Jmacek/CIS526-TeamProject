/**
 * Created by Matt on 4/1/2016.
 */

var gameIDArr = {};
var gameArr = {};
var waitQueue = [];
var socketArr={};
var playerArr = [];

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
            gameID = lookupGameID(socket);
            delete gameIDArr[socket.id];
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
        var opponent = lookupOpponent(socket.id);
        if(opponent !== null)
            opponent.emit('text_change', msg);
        //io.emit('text_change', msg);8
    });

    socket.emit('identify');
}
//socket is the client socket that we are sending the update to
//players is the object {Player1:"name1",Player2:"name2"} identifying


function createGame(player1,player2){
    var challenges = [];
    challenges[0] = "This is challenge 1";
    challenges[1] = "This is challenge 2";
    challenges[2] = "This will be challenge 3";

    var gameID = "set via databaseID probably";
    gameIDArr[player1.socketID] = gameID;
    gameIDArr[player2.socketID] = gameID;

    var gameTuple = {player1:player1,player2:player2};

    gameArr[gameID]=gameTuple;

    var matchup = {player1:player1.playerName,player2:player2.playerName};
    sendMatchup(gameTuple,matchup);
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
        console.log("SocketID not in gameIDArr!");
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
function sendMatchup(gameTuple,matchup){
    S1 = lookupSocket(gameTuple.player1.socketID);
    S2 = lookupSocket(gameTuple.player2.socketID);
    console.log("Setting players: ",matchup);
    S1.emit('match_set',matchup);
    S2.emit('match_set',matchup);
}

function sendChallenges(gameTuple,challenges){
    S1 = lookupSocket(gameTuple.player1.socketID);
    S2 = lookupSocket(gameTuple.player2.socketID);
    S1.emit('challenge_set',challenges);
    S2.emit('challenge_set',challenges);
}

module.exports = exports = connect;