/**
 * Created by Matt on 3/31/2016.
 */
$(function(){
    var socket = io();

    $('span').on("keyup",function(){
        var boxID = this.className;
        var boxValue = $('.'+boxID).html();
        console.log(boxID);
        socket.emit('text_change',[boxID,boxValue]);
    });

    socket.on('text_change', function(msg){
        var id = msg[0];
        var text = msg[1];
        console.log('Recipient = ' + id);
        console.log('    Text: ' + text);
        $('.'+id).html(text);
    });
});
