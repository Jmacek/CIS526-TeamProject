/**
 * Created by Matt on 3/31/2016.
 */
var currentBox;//needed for catch
var userCaught = false;
var socket = io();

$(function(){

    //catching opponent
    socket.on('catch',function(m){
        ///console.log("in catch",m);
        var curElement = document.activeElement;
        ///console.log("trying to catch in "+currentBox+', activeElement = '+curElement);
        if(currentBox == m && !userCaught){
            ServePenalty();
            socket.emit('caught',true);//tell opponent ive been caught
        }
    });

    socket.on('caught',function(m){
        userCaught = m;
        document.body.style.background = '#ADDFFF';
        setTimeout(function(){document.body.style.background = 'transparent';},300);
        //alert("opponent caught: "+m);
    });

    //get a word
    socket.on('flash',function(num, player){
        var challengeDiv = "#challengeBox-"+(num+1);
        var className;
        if(player == 'player1'){ //flash red
            $(challengeDiv).addClass("pulse-red");
            className = "pulse-red";
        }
        else if(player == 'player2'){
            $(challengeDiv).addClass("pulse-blue");
            className = "pulse-blue";
        }
        setTimeout(function(){
            $(challengeDiv).removeClass(className);
        }, 1000);
    });

    setTimeout(function(challengeDiv, className){
        $(challengeDiv).removeClass(className);
    }, 1000);

    socket.on('new_text',function(m){
        var curElement = document.getElementById(m.id);
        curElement.textContent = m.text;
    });//handles changed text

    socket.on('score',function(m){

        setSuperList(m);
        UpdateChallengeBoxes();
        setScore();
    });//handles the up dated superList from the server

    socket.on('identify',function(){
        var userName = localStorage.username;

        $('#loadScreen').attr('class','fullscreen');
        //if game had already started, force reload
        if ($('body').data('whoami'))
            window.location.reload();
        //console.log("Setting self as: ", userName);
        $("body").data("playerName",userName);
        //console.log("body.data('playerName') set as: ",$("body").data("playerName"));
        socket.emit('identity',userName);
    });

    socket.on('match_set',function(info){
        var players = info.players;
        var player1 = players['player1'];
        var player2 = players['player2'];
        var currentPlayer;

        if(info.number == 1) {
            $("body").data("whoami", "player1");
            document.getElementById("color").textContent = "You are Red";
            $("#color").addClass("red");
            $(".player1-challengeBox").addClass("player1-box");
            $('h2.player1').html('Me!');
            $('h2.player2').html(player2);
            currentPlayer = 1;
        }
        else {
            $("body").data("whoami", "player2");
            document.getElementById("color").textContent = "You are Blue";
            $("#color").addClass("blue");
            $(".player2-challengeBox").addClass("player2-box");
            $('h2.player1').html(player1);
            $('h2.player2').html('Me!');
            currentPlayer = 2;
        }
        showIntro(currentPlayer,info.time);
    });

    socket.on('game_over',function(data){
        document.getElementById("timer").innerHTML="Game Over!";
        var score1 = $('#player1_score').text();
        var score2 = $('#player2_score').text();
        var player1 = data.player1;
        var player2 = data.player2;
        var winnerScore;
        var winner;

        var win = $('#gameOverScreen div h3:nth-of-type(1)');
        var forfeit = $('#gameOverScreen div h1:nth-of-type(1)');
        if(data.playerForfeit){
            forfeit.text(data.playerForfeit + " has forfeited");
            if(data.playerForfeit === player1) {
                win.text('Winner: ' + player2);
                win.attr('class','player2');
            }
            else{
                win.text('Winner: ' + player1);
                win.attr('class','player1');
            }
        }
        else {
            if (score1 > score2) {
                win.text('Winner: ' + player1);
                win.attr('class', 'player1');
                winner = player1;
                winnerScore = score1;
            }
            else if (score1 < score2) {
                win.text('Winner: ' + player2);
                win.attr('class', 'player2');
                winner = player2;
                winnerScore = score2;
            }
            else {
                win.text('Tie!');
                winner = "It was a tie";
                winnerScore = score1;
            }
        }
        //Save to DB
        if (data.msg != null && data.msg === 'save') {
            socket.emit('saveToDB', { winner: winner, player1: player1, player2: player2, winnerScore: winnerScore});
        }
        var p1 = $('#gameOverScreen div h4:nth-of-type(1)');
        p1.text('Player 1: '+score1);
        p1.attr('class','player1');
        var p2 = $('#gameOverScreen div h4:nth-of-type(2)');
        p2.text('Player 2: '+score2);
        p2.attr('class','player2');

        $('#gameOverScreen').attr('class','fullscreen');
    });
});

