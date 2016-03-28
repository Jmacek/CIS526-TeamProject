/**
 * Created by Matt on 3/26/2016.
 */
nodeRSA = require('node-rsa');
$(function(){
    var pubKeyPEM = $('p.hidden')[0].textContent;
    var pubKey = new nodeRSA().importKey(pubKeyPEM,'pkcs8-public-pem');

    function pubEncrypt(data){
        return pubKey.encrypt(data,'base64');
    }

    $( "#loginForm" ).submit(function( event ) {
        event.preventDefault();
        //alert('caught');
        var username = $('#inputEmail').val();
        var password = $('#inputPassword').val();
        var array = {username:username, password:password};
        var inJson = JSON.stringify(array);
        var toSend = pubEncrypt(inJson);
        $('#actualSubmit input')[0].val(toSend);
        $('#actualSubmit').submit();
    });
});

//the non-browserified version of toAdd.js