/**
 * Created by gannonhuiting on 3/28/16.
 */


var textControl =
{
    readText: readText

}
function readText()
{
    var socket = io('http://localhost');
    var x = document.getElementById("shared_box");
    console.log(x.value);
    socket.emit('text-change', x.value);
}


module.exports = exports = textControl;