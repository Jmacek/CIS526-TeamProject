/**
 * Created by Matt on 3/31/2016.
 */
var currentPlayer = 0;
var opponent = 0;
var count = 0;
var counter; //needed for end of timer

$(function(){
    var playerId
    var socket = io();
    var superList = [];

    //use this for later
    $('.textBox_player1').focusin(function(){console.log("succuess");});
    document.ondblclick = function(){

        var curElement = document.activeElement;
        if(curElement.id.split("-")[0] == playerId) {
            console.log("about to send catch")
            socket.emit('catch', curElement.id);
        }
    }
    //$('.textBox_player1').on("click",function(){console.log("succuess");});
    //$('#player1_box1').on("click",function(){console.log("succuess");});

    $('#catch').on("click",function()
    {
        socket.emit('catch');
    });

    socket.on('catch',function(m){
        console.log("in catch",m);
        var curElement = document.activeElement;
        if(curElement.id == m){
            ServePenalty(15);
        }
    });

    //socket.on('catch',function(){
    //
    //    var curElement = document.activeElement;
    //    if(curElement.id.indexOf("player"+opponent) !== -1){
    //        ServePenalty(15);
    //    }
    //});

    function setScore() {
        var p1Score = 0;
        var p2Score = 0;
        for(var i = 0; i < superList.length; i++)
        {
            for(var j = 0; j < superList[i].length; j++)
            {
                if(superList[i][j].attribute == 'player1')
                {
                    p1Score+=superList[i][j].word.length;
                }
                else if(superList[i][j].attribute == 'player2')
                {
                    p2Score+=superList[i][j].word.length;
                }
            }
        }

        document.getElementById('player1_score').textContent = p1Score;
        document.getElementById('player2_score').textContent = p2Score;
    }//updates the score with the superList

    {//initialize the super list
        function setChallenge(orig_challenges) {
            var num = orig_challenges.length;
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
                superList[i] = listOfWordObjects;
            }

            //makes the challenge boxes update
            UpdateChallengeBoxes();

        } //intializes superlist.

        function UpdateChallengeBoxes() {
            for (var i = 0; i < superList.length; i++) {
                var toReplace = [];
                for (var j = 0; j < superList[i].length; j++) {
                    toReplace [j] = "<span class='" + superList[i][j].attribute + "'>" + superList[i][j].word + "</span>";
                }
                var num = i + 1
                $('#challenge-' + num).html(toReplace.join(' '));

            }
        } //uses super list to update the challenge boxes.
    }//initialize the super list

    {//serve penalty stuff

        function disableTextboxes() {

            var s1 = document.getElementsByClassName("textBox_player1");
                console.log("s1",s1);
                for(var i = 0; i < s1.length;i++)
                {
                    s1[i].contentEditable = false;
                }

            var s2 = document.getElementsByClassName("textBox_player2");
                console.log("s2",s2);
                for (var i = 0; i < s2.length; i++) {
                    s2[i].contentEditable = false;
                }
        }

        function enableTextboxes() {
            var s1 = document.getElementsByClassName("textBox_player1");

            for(var i = 0; i < s1.length;i++)
            {
                console.log("id",s1[i].id);
                //looks stupid but works.
                s1[i].contentEditable = true;
            }

            var s2 = document.getElementsByClassName("textBox_player2");

            for (var i = 0; i < s2.length; i++) {
                s2[i].contentEditable = true;
            }
        }

        function showTimeout(time) {
            if (time != 0) {
                document.body.style.background = '#ff6666';
                document.getElementById("time-out").textContent = "You got caught! Time-in in: " + time;
            }
            else {
                document.body.style.background= 'transparent';
                document.getElementById("time-out").textContent = "Time In";
            }
        }

        function ServePenalty(time) {
            disableTextboxes();
            showTimeout(time);

            setTimeout(function () {
                    enableTextboxes();
                }
                , time * 1000);

            var functArr = [];
            for (var i = 0; i <= time; i++) {
                functArr.push({
                    funct: function (time, totalTime) {
                        setTimeout(function () {
                                showTimeout(totalTime - time)
                            }
                            , time * 1000)
                    }

                    , time: i
                });
            }

            for (var i = 0; i < functArr.length; i++) {
                var thing = functArr[i];
                thing.funct(thing.time, time);
            }
        }
    }//servePenalty stuff

    function replaceAt(string,index,char)
    {
        var out = "";
        for(var i = 0; i < string.length; i++)
        {
            if(i != index)
            {
                out+=string[i];
            }
            else
            {
                out+=char;
            }
        }
        return out;
    }

    function findOpositeElement(curElement)
    {

        var elms = curElement.split("-");

        if(elms[0][elms[0].length-1] == '1'){
            elms[0] = replaceAt(elms[0],elms[0].length-1,"2");
            var v =  elms[0]+"-"+elms[1];
            return v;
        }
        else if(elms[0][elms[0].length-1] == '2')
        {
            elms[0] = replaceAt(elms[0],elms[0].length-1,"1");
            var v =  elms[0]+"-"+elms[1];
            console.log(v);
            return v;
        }
    }

    function PreformMatch(playerId,num,index)//marked
    {
        wordIndex[num-1] = index;
        $('span', '#challenge-' + num)[wordIndex[num-1]].className = playerId;
        if(challengeWords[num-1][index+1] !== undefined)
        {
            wordIndex[num-1]++;
            $('span', '#challenge-' + num)[wordIndex[num-1]].className = "active";
            //document.getElementById("challenge-"+num)[wordIndex[num-1]].className = "active";
        }

    }

    socket.on('flash',function(num){

    });

    $(document).on("keyup",function(){
        var curElement = document.activeElement;
        //why wont contains work? I have to do this every time to get this to make sense,
        // aslo why does class name not return just the class name.
        //checks to make sure the keypress is in a player box otherwize it will cause errors
        if(curElement.className.toString().indexOf("textBox_player1") != -1 || curElement.className.toString().indexOf("textBox_player2") != -1)
        //tell the server that the text was updated
            var opositeId = findOpositeElement(curElement.id);

        var opositeText = document.getElementById(opositeId).textContent;
        var m = {first:{id:curElement.id,text:curElement.textContent},
            second:{id:opositeId,text:opositeText}};//check their stuff
        socket.emit('new_text',m);//check current box

    });

    socket.on('new_text',function(m){
        var curElement = document.getElementById(m.id);
        curElement.textContent = m.text;
    });//handles changed text

    socket.on('score',function(m){

        superList = m;
        UpdateChallengeBoxes();
        setScore();
    });//handles the up dated superList from the server

    socket.on('identify',function(){
        var userName = localStorage.username;

        //if game had already started, force reload
        if ($('body').data('whoami'))
            window.location.reload();
        console.log("Setting self as: ", userName);
        $("body").data("playerName",userName);
        console.log("body.data('playerName') set as: ",$("body").data("playerName"));
        socket.emit('identity',userName);
    });

    socket.on('match_set',function(info){
        var players = info.players;
        var player1 = players['player1'];
        var player2 = players['player2'];


        if(info.number == 1) {
            $("body").data("whoami", "player1");
            playerId = "player1";
            document.getElementById("color").textContent = "You are Red";
            $("#color").addClass("red");
            $(".player1-challengeBox").addClass("player1-box");
            $('h2.player1').html('Me! (player 1)');
            $('h2.player2').html(player2);
            currentPlayer = 1;
            opponent = 2;
        }
        else {
            $("body").data("whoami", "player2");
            playerId = "player2";
            document.getElementById("color").textContent = "You are Blue";
            $("#color").addClass("blue");
            $(".player2-challengeBox").addClass("player2-box");
            $('h2.player1').html(player1+' (player 1)');
            $('h2.player2').html('Me!');
            currentPlayer = 2;
            opponent = 1;
        }
        count = info.time;
        counter=setInterval(timer, 1000);

    });

    socket.on('game_over',function(msg){
        document.getElementById("timer").innerHTML="Game Over!";
        if (msg === 'forfeit')
            var x = 4;
            //do something special

    });

    //http://stackoverflow.com/questions/1191865/code-for-a-simple-javascript-countdown-timer
    function timer()
    {
        count=count-1;
        var current = document.getElementById("timer").innerHTML;
        if (count <= 0 || current ==="Game Over!")
        {
            document.getElementById("timer").innerHTML="Time left: "+0 + " secs";
            clearInterval(counter);
            return;
        }

        document.getElementById("timer").innerHTML="Time left: "+count + " secs"; // watch for spelling
    }

    function setSelectionRange(input, selectionStart, selectionEnd) {
        if (input.setSelectionRange) {
            console.log('if');
            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }
        else if (input.createTextRange) {
            console.log('else');
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        }
    }



//Namespace management idea from http://enterprisejquery.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
    (function( cursorManager ) {
        //From http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
        //From: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
        var voidNodeTags = ['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'MENUITEM', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR', 'BASEFONT', 'BGSOUND', 'FRAME', 'ISINDEX'];

        //From: http://stackoverflow.com/questions/237104/array-containsobj-in-javascript
        Array.prototype.contains = function(obj) {
            var i = this.length;
            while (i--) {
                if (this[i] === obj) {
                    return true;
                }
            }
            return false;
        };

        //Basic idea from: http://stackoverflow.com/questions/19790442/test-if-an-element-can-contain-text
        function canContainText(node) {
            if(node.nodeType == 1) { //is an element node
                return !voidNodeTags.contains(node.nodeName);
            } else { //is not an element node
                return false;
            }
        }

        function getLastChildElement(el){
            var lc = el.lastChild;
            while(lc && lc.nodeType != 1) {
                if(lc.previousSibling)
                    lc = lc.previousSibling;
                else
                    break;
            }
            return lc;
        }

        //Based on Nico Burns's answer
        cursorManager.setEndOfContenteditable = function(contentEditableElement)
        {

            while(getLastChildElement(contentEditableElement) &&
            canContainText(getLastChildElement(contentEditableElement))) {
                contentEditableElement = getLastChildElement(contentEditableElement);
            }

            var range,selection;
            if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
            {
                range = document.createRange();//Create a range (a range is a like the selection but invisible)
                range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                selection = window.getSelection();//get the selection object (allows you to change selection)
                selection.removeAllRanges();//remove any selections already made
                selection.addRange(range);//make the range you have just created the visible selection
            }
            else if(document.selection)//IE 8 and lower
            {
                range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
                range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                range.select();//Select the range (make it the visible selection
            }
        }

    }( window.cursorManager = window.cursorManager || {}));
});
