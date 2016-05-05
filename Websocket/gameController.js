/**
 * Created by Matt on 4/1/2016.
 */
    var assert = require('assert');

var data = {
    gameIDArr : {}, //matches sockets to gameIDs
    gameArr : {},//matches gameIDs to players tuple (socketID,playername) for both players and timeout object
    waitQueue : [],
    socketArr : {},//matches sockets to socketIDs
    playerArr : [],//matches players to socketIDs
    UltraList : [],//list of all challnge words in all games.
    gameTime : 120//length of game (in seconds)
};

var gameIDArr = data.gameIDArr; //matches sockets to gameIDs
var gameArr = data.gameArr;//matches gameIDs to players tuple (socketID,playername) for both players and timeout object
var waitQueue = data.waitQueue;
var socketArr= data.socketArr;//matches sockets to socketIDs
var playerArr = data.playerArr;//matches players to socketIDs
var UltraList = data.UltraList;//list of all challnge words in all games.
var gameTime = data.gameTime;//length of game (in seconds)
var db = require('../database/db');

var functions = {
    showConnection:showConnection,
    GoThroughSuperlist:GoThroughSuperlist,
    setChallenge:setChallenge,
    sendChallenges:sendChallenges,
    sendMatchup:sendMatchup,
    createGame:createGame,
    sendGameOver:sendGameOver,
    lookupSocket:lookupSocket,
    lookupPlayer:lookupPlayer,
    lookupGameID:lookupGameID,
    lookupGame:lookupGame,
    lookupOpponent:lookupOpponent
};


//where a given socket
function connect(socket) {

    var f = functions;

    var clientIP = f.showConnection(this);

    socket.on('new_text',function(m) {

        var gameID = f.lookupGameID(socket.id);//gets the gameid
        var opponent = f.lookupOpponent(socket.id);
        var s = f.GoThroughSuperlist(m.first.id, m.first.text, UltraList[gameID],socket.id);//updates the super list
        s = f.GoThroughSuperlist(m.second.id, m.second.text, UltraList[gameID],socket.id);//updates it for the other guy
        socket.emit('score', s);
        opponent.emit('score', s);

        opponent.emit('new_text',{id:m.first.id,text:m.first.text});

    });

    socket.on('disconnect', function () {
        //console.log(clientIP, " disconnected");
        //remove from socketArr
        if(socket.id in gameIDArr){
            var gameID = f.lookupGameID(socket.id);
            var opponent = f.lookupOpponent(socket.id);
            delete gameIDArr[socket.id];
            var gameTuple = f.lookupGame(gameID);
            clearTimeout(gameTuple.timeout);
            var S1 = f.lookupSocket(gameTuple.player1.socketID);
            var S2 = f.lookupSocket(gameTuple.player2.socketID);
            if(S1 != null && S2 != null) {
                var player1 = f.lookupPlayer(S1.id);
                var player2 = f.lookupPlayer(S2.id);
                if (opponent) {
                    opponent.emit('game_over', {
                        player1: player1,
                        player2: player2,
                        msg: 'forfeit',
                        playerForfeit: f.lookupPlayer(socket.id)
                    });
                }
            }

            //TODO: if game in GameArr, then forefit
        }
        else {
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

    socket.on('catch',function(m) {
        var opponent = f.lookupOpponent(socket.id);
        if(opponent !== null)
            opponent.emit('catch',m);
    });

    socket.on('caught',function(m){
        var opponent = f.lookupOpponent(socket.id);
        if(opponent !== null)
            opponent.emit('caught',m);
    });

    socket.on('identity',function(playerName){
        socketArr[socket.id]= socket;
        playerArr[socket.id]= playerName;
        var player = {socketID:socket.id,playerName: playerName};
        if(waitQueue.length % 2 == 0){
            waitQueue.push(player.socketID);
        }
        else{
            var player1ID = waitQueue.shift();
            var player1 = {socketID:player1ID,playerName: f.lookupPlayer(player1ID)};
            var player2 = player;
            f.createGame(player1,player2);
        }
    });
    socket.on('saveToDB', function(data){
        db.run("INSERT INTO Scores (player1, player2, winner, winnerScore) VALUES (?,?,?,?)",
            data.player1, data.player2, data.winner, data.winnerScore, function(err){
                if(err){
                    throw err;
                }
            });
    });

    socket.emit('identify');
}

function showConnection(s){
    var id = '';
    for (var propertyName in s.connected) {
        id = propertyName;
    }
    var clientIP = s.connected[id].client.conn.remoteAddress;
    //console.log("(IPv6) ", clientIP, "connected");
    return clientIP;
}

function GoThroughSuperlist(id,text,superList,socketID) {
    var num = id[id.length - 1]-1;//last char is the num
    var player = id.split("-")[0];
    var currWords = text.split(" ");
    var used = [];
    var numActive = 0; // this number is the number of active words. it must be zero by the end of the nested loop
    var curPlayer = lookupSocket(socketID);
    var opponent = lookupOpponent(socketID);
    // or the next word will not be revealed
    for(var i = 0; i < superList[num].length; i++) {
        if(superList[num][i].attribute == 'active'){numActive++;}//there was an active element
        var found = false;//assume the super word does not exist in the text box
        if(superList[num][i].attribute != 'hidden') {//don't want to check for a hidden value
            for (var j = 0; j < currWords.length; j++) {
                if(!used[j]) {
                    if (superList[num][i].attribute == 'active' && currWords[j].trim() == superList[num][i].word) {
                        superList[num][i].attribute = player;
                        found = true;
                        used[j] = true;//this word was used
                        numActive--; //this active element was in the text box
                        curPlayer.emit('flash', num, player); //flash challenge box
                        opponent.emit('flash', num, player); //flash challenge box
                        break;//no need to search anymore the word was found
                    }
                    else if (superList[num][i].attribute == player && currWords[j].trim() == superList[num][i].word) {
                        found = true;//super word does exist in the text box
                        used[j] = true;//this word was used
                        //opponent.emit('flash', num, player);
                        break;//no need to search anymore the word was found
                    }
                }
            }
        }
        else {//if we hit a hidden element we exit the loop, all other elements will be hidden
            if(numActive == 0){//if there are no active elements
                superList[num][i].attribute = 'active';//make it active
            }
            break;//break out of the loop
        }
        if(!found && superList[num][i].attribute == player){
            superList[num][i].attribute = 'active';
        }//it is up for grabs.
    }//end of outer for loop
    return superList;
}

//socket is the client socket that we are sending the update to
//players is the object {Player1:"name1",Player2:"name2"} identifying
function setChallenge(orig_challenges,id) {
    var num = orig_challenges.length;
    UltraList[id] = [];
    //crates a list we can use and update
    for (var i = 0; i < num; i++) {
        //will contain word and attribute like "hidden", "Player1" ect.
        var listOfWordObjects = [];
        var tempWordList = orig_challenges[i].split(' ');
        for (var j = 0; j < tempWordList.length; j++) {
            //set the fist one to active
            if (j == 0) {
                listOfWordObjects[j] = {word: tempWordList[j], attribute: "active"}
            }
            else {
                listOfWordObjects[j] = {word: tempWordList[j], attribute: "hidden"}
            }
        }
        UltraList[id][i] = listOfWordObjects;
    }

    //makes the challenge boxes update

}

function sendGameOver(gameID,msg){

    console.log("sending gameOver");
    var gameTuple = functions.lookupGame(gameID);
    var S1 = functions.lookupSocket(gameTuple.player1.socketID);
    var S2 = functions.lookupSocket(gameTuple.player2.socketID);
    var player1 = functions.lookupPlayer(S1.id);
    var player2 = functions.lookupPlayer(S2.id);
    S1.emit('game_over',{ player1: player1, player2: player2 } );
    S2.emit('game_over',{ player1: player1, player2: player2, msg: 'save'} ); //sending save message to save score to db
}

function createGame(player1,player2){

    var numChallenges = 3;
    var challenges = [];
    for(var i = 0; i < numChallenges; i++)
    {
        var e = Math.random()*global.challenges.length;
        e = e|0;
        challenges[i] = global.challenges[e].challenge;
    }

    //challenges[0] = "This is is is is is challenge 1";
    //challenges[1] = "This is This is This is challenge 2";
    //challenges[2] = "This will be challenge 3 3 3 3";

    var gameID;
    do{
        gameID = randomInt(0,10000);
    }while(gameID in gameArr);

    gameIDArr[player1.socketID] = gameID;
    gameIDArr[player2.socketID] = gameID;

    functions.setChallenge(challenges,gameID);

    console.log("player1 socketID = "+player1.socketID);
    console.log("player2 socketID = "+player2.socketID);

    var timeoutObj = setTimeout(functions.sendGameOver,data.gameTime*1000,gameID);
    var gameTuple = {player1:player1,player2:player2,timeout:timeoutObj};

    gameArr[gameID]=gameTuple;

    var matchup = {player1:player1.playerName,player2:player2.playerName};
    functions.sendMatchup(gameTuple,matchup,data.gameTime-11);

    functions.sendChallenges(gameTuple,UltraList[gameID])
}

function lookupSocket(socketID){
    if(socketID in socketArr)
        return socketArr[socketID];
    //else
    //    console.log("SocketID "+socketID+" not in socketArr!\n");
    return null
}

function lookupPlayer(socketID){
    if(socketID in playerArr)
        return playerArr[socketID];
    //else
    //    console.log("SocketID not in playerArr!");
    return null
}

function lookupGameID(socketID){
    if(socketID in gameIDArr)
        return gameIDArr[socketID];
    //else
    //    console.log("SocketID not in gameIDArr!"+ JSON.stringify(gameIDArr));
    return null
}

function lookupGame(gameID){
    if(gameID in gameArr)
        return gameArr[gameID];
    //else
    //    console.log(gameID, "not in gameArr!",gameArr);
    return null
}

function lookupOpponent(socketID){
    var gameID = functions.lookupGameID(socketID);
    if(gameID === null)
        return null;
    var game = functions.lookupGame(gameID);
    firstPlayer = game['player1'].socketID;
    if (socketID == firstPlayer)
        return functions.lookupSocket(game['player2'].socketID);
    else
        return functions.lookupSocket(firstPlayer);

}

//Sends the matchup for the game to the players in the form of:
//{player1:"name",player2:"name"}
function sendMatchup(gameTuple,matchup,time){
    S1 = functions.lookupSocket(gameTuple.player1.socketID);
    S2 = functions.lookupSocket(gameTuple.player2.socketID);
    console.log("Setting players: ",matchup,'\n');
    S1.emit('match_set',{players:matchup,number:1,time:time});
    //console.log("Socket ID "+S1.id+" is set as first player");
    S2.emit('match_set',{players:matchup,number:2,time:time});//reversed the 2 and 1 somewhere
}

function sendChallenges(gameTuple,challenges){
    S1 = functions.lookupSocket(gameTuple.player1.socketID);
    S2 = functions.lookupSocket(gameTuple.player2.socketID);
    S1.emit('score',challenges);
    S2.emit('score',challenges);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

module.exports = exports = {
    functions:functions,
    connect:connect,
    data:data};

