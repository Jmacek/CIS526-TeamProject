/**
 * Created by Matt on 4/16/2016.
 */

var count = 0;
var counter; //needed for end of timer
var superList = [];

var servePenaltyTime = 10; //in seconds
var introTime = 10; //in seconds
//var gameTime = 120; //in seconds

$(function(){

    var backspaceSlowdownTime = 100; //in milliseconds
    var backspaceIsPressed = false;
    var backspaceSlowdown = false;


    $(window).on('beforeunload', function (e) {
        if(backspaceIsPressed){
            backspaceIsPressed = false;
            return "Please don't try to select text.\n" +
                "If you choose to leave the page, the game will end.";
        }
    });

    function handleBoxClick(clickedElem,event){
        var spanID = $(clickedElem).children().children().children().attr('id');
        //console.log(spanID);
        if(spanID !== undefined){
            event.stopPropagation();
            if(currentBox != spanID){
                currentBox = spanID;
                //console.log('currentBox set to,'+currentBox);
            }
            document.getElementById(spanID).focus();
        }
    }

    $('div').on('click',function(event) {
        handleBoxClick(this,event);
    });

    //use this for later
    $('div').on('dblclick',function(event){
        handleBoxClick(this,event);
        var playerID = $("body").data("whoami");
        if(currentBox.split("-")[0] == playerID) {
            socket.emit('catch', currentBox);
        }
    });

    $('*').on('mouseup keyup',function(e){

        if (window.getSelection && window.getSelection().type === 'Range') {
            //console.log('before');
            //console.log(e);
            var currentTarget = $('#'+currentBox)[0];
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();

            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
            cursorManager.setEndOfContenteditable(currentTarget);
            //console.log('after');
            //console.log(e);
        } else if (document.selection && document.selection.type === 'Range') {  // IE?
            var currentTarget = $('#'+currentBox)[0];
            document.selection.empty();
            cursorManager.setEndOfContenteditable(currentTarget);
        }

    });

    $('*',"[class*= 'challengeBox']").on("keyup",function(e){
        //check current box
        sendUpdate();
    });

    function sendUpdate(){
        var curElement = $('#'+currentBox)[0];

        var elementClass = curElement.className.toString();

        //why wont contains work? I have to do this every time to get this to make sense,
        // aslo why does class name not return just the class name.
        //checks to make sure the keypress is in a player box otherwize it will cause errors
        if(curElement.className.toString().indexOf("textBox_player1") != -1 || curElement.className.toString().indexOf("textBox_player2") != -1)
        //tell the server that the text was updated
            var oppositeId = findOppositeElement(curElement.id);

        var oppositeText = document.getElementById(oppositeId).textContent;
        var m = {first:{id:curElement.id,text:curElement.textContent},
            second:{id:oppositeId,text:oppositeText}};//check their stuff
        socket.emit('new_text',m);
    }

    $(document).on('keydown',function(event){
        if (event.which == 8 || event.keyCode == 8) {
            backspaceIsPressed = true;
            //console.log(event);
            if($(event.target).is('body'))
                event.preventDefault();
            //else
            //console.log($(event.target));
        }
        var curElement = document.activeElement;

        var elementClass = curElement.className.toString();
        var player = $("body").data("whoami");
        var ownsBox = (elementClass.indexOf(player) != -1);

        //logic for slowing down deletion when deleting from an opponent's box
        if(backspaceIsPressed&& !ownsBox && backspaceSlowdown){
            event.preventDefault();
            return false;
        }
        else if(backspaceIsPressed&& !ownsBox )
        {
            backspaceSlowdown = true;
            setTimeout(function(){
                sendUpdate();
                backspaceSlowdown = false;
            },backspaceSlowdownTime);

        }
    });

    $(document).on('keyup',function(event){
        if (event.which == 8 || event.keyCode == 8) {
            backspaceIsPressed = false
        }
    });
});

function setSuperList(m){
    superList = m;
}

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

function findOppositeElement(curElement)
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
        //console.log(v);
        return v;
    }
}

{//serve penalty stuff

    function disableTextboxes() {

        var s1 = document.getElementsByClassName("textBox_player1");
        console.log("s1",s1);
        for(var i = 0; i < s1.length;i++)
        {
            s1[i].contentEditable = false;
        }

        var s2 = document.getElementsByClassName("textBox_player2");
        //console.log("s2",s2);
        for (var i = 0; i < s2.length; i++) {
            s2[i].contentEditable = false;
        }
    }

    function enableTextboxes() {
        var s1 = document.getElementsByClassName("textBox_player1");

        for(var i = 0; i < s1.length;i++)
        {
            //console.log("id",s1[i].id);
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
            socket.emit('caught',false);//tell opponent im free
        }
    }

    function ServePenalty() {
        var time = servePenaltyTime;
        userCaught = true;
        disableTextboxes();
        showTimeout(time);

        setTimeout(function () {
                userCaught = false;
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
            var num = i + 1;
            $('#challenge-' + num).html(toReplace.join(' '));
        }
    } //uses super list to update the challenge boxes.
}//initialize the super list

function showIntro(currentPlayer,time){
    var playerID = $("body").data("whoami");
    $('#instructions div h4:nth-of-type(1)').html('You are <span class='+playerID+'> Player '+currentPlayer+'!</span>');
    $('#instructions').attr('class','fullscreen');
    $('#loadScreen').attr('class','hidden');
    setTimeout(function(){
        $('#instructions').attr('class','hidden');
        startGameClock(time);
    },introTime*1000);
}

function startGameClock(time){
    count = time;
    counter=setInterval(timer, 1000);
}

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
        //console.log('if');
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
        //console.log('else');
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

