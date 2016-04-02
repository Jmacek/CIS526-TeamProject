/**
 * Created by Matt on 3/31/2016.
 */
$(function(){
    var challenges = [];
    var wordAt = [];
    var socket = io();

    $('span').on("keyup",function(){
        var boxID = this.className;
        var boxID = $(this).parent().attr('id');
        var boxValue = $('#'+boxID).html();
        console.log(boxID);
        socket.emit('text_change',[boxID,boxValue]);
    });

    socket.on('text_change', function(msg){
        var id = msg[0];
        var text = msg[1];
        console.log('Recipient = ' + id);
        console.log('    Text: ' + text);
        $('#'+id).html(text);
        cursorManager.setEndOfContenteditable($('#'+id)[0]);
    });

    socket.on('identify',function(){
        var userName = localStorage.username;
        console.log("Setting self as: ", userName);
        $("body").data("playerName",userName);
        console.log("body.data('playerName') set as: ",$("body").data("playerName"));
        socket.emit('identity',userName);
    });

    socket.on('challenge_set',function(orig_challenges){
        console.log("setting challenges...");
        var num = orig_challenges.length;
        for(var i = 1;i<num+1;i++){
            words = orig_challenges[i-1].split(' ');
            var toReplace = [];
            $.each(words,function(index,value){
                toReplace [index] = "<span class='hidden'>"+value+"</span>";
            });
            challenges[i-1] = orig_challenges[i-1];
            wordAt[i-1] = 0;
            $('#challenge-'+i).html(toReplace.join(' '));
            updateChallenge(i)
        }
    });

    function updateChallenge(x){
        var atWord = wordAt[x-1];
        console.log(atWord);
        $('span','#challenge-'+x)[atWord].className = 'active';
        // current-x
        // challenge-x

    }

    socket.on('set_matchup',function(players){
        var player1 = players['player1'];
        var player2 = players['player2'];
        if($("body").data("playerName") == player1)
            $("body").data("whoami","Player 1");
        else
            $("body").data("whoami","Player 2");

        $('h2.player1')[0].html(player1);
        $('h2.player2')[0].html(player2);
    });

    socket.on('match',function(m){
        var num = m[0];
        var atWord = m[1];
        var player = m[2];
        wordAt[num-1] = wordAt[num-1] + 1;
        var actual = $('.active','#challenge-'+num)[0].innerHTML;
        $('span','#challenge-'+num)[atWord].className = player;
        $('span[id*="-w'+num+'"]').before("<span class='completed-"+player+"'>"+actual+" </span>");
        $('span[id*="-w'+num+'"]').html('&nbsp');
        var span = $('#'+player+'-w'+num)[0];
        updateChallenge(num);
    });

    $('span.writing').on('keyup',function(){

        var toTest = $.trim($(this)[0].innerText);
        var l = $(this).attr('id').length;
        var num = $(this).attr('id')[l-1];
        var actual = $('.active','#challenge-'+num)[0].innerHTML;
        console.log("toTest = ", toTest);
        console.log("Actual = ", actual);
        var player = $(this).attr('id').split('-')[0];
        console.log(this);
        if(toTest === actual){
            console.log("MATCH");
            var atWord = wordAt[num-1];
            $('span','#challenge-'+num)[atWord].className = player;
            socket.emit('match',[num,atWord,player]);
            console.log(wordAt);
            wordAt[num-1] = wordAt[num-1] + 1;
            console.log(wordAt);
            $('span[id*="-w'+num+'"]').before("<span class='completed-"+player+"'>"+actual+" </span>");
            $('span[id*="-w'+num+'"]').html('&nbsp');
            var span = $('#'+player+'-w'+num)[0];
            updateChallenge(num);
            setCaretToPos(span,0,0);
        }
    });

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

    function setCaretToPos (input, pos) {
        setSelectionRange(input, pos, pos);
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
