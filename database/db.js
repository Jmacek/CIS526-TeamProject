var sqlite3 = require('sqlite3'),
    fs = require('fs'),
    db = new sqlite3.Database('./database/development.sqlite3');

//checks if database has been initialized
fs.access('./database/development.sqlite3', fs.F_OK, function(err){
    if(err) seed();
});

function seed(){
    console.log("creating development.sqlite3");
    db.serialize(function(){
        //Drop table if exists
        db.run("DROP TABLE IF EXISTS Users");
        db.run("CREATE TABLE Users (userID INTEGER PRIMARY KEY, username TEXT UNIQUE, passwordDigest TEXT, salt TEXT, admin BOOLEAN)");

        //Drop table if exists
        db.run("DROP TABLE IF EXISTS Scores");
        db.run("CREATE TABLE Scores(ID INTEGER PRIMARY KEY, player1 TEXT, player2 TEXT, winner TEXT, winnerScore INTEGER)");
    });
}

module.exports = exports = db;