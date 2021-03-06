var sqlite3 = require('sqlite3'),
    db = new sqlite3.Database('../development.sqlite3'); //this one is fine because we only ever run seed.js directly

db.serialize(function(){

    //Drop table if exists
    db.run("DROP TABLE IF EXISTS Users");
    db.run("CREATE TABLE Users (userID INTEGER PRIMARY KEY, username TEXT UNIQUE, passwordDigest TEXT, salt TEXT, admin BOOLEAN)");

    //Drop table if exists
    db.run("DROP TABLE IF EXISTS Scores");
    db.run("CREATE TABLE Scores(ID INTEGER PRIMARY KEY, player1 TEXT, player2 TEXT, winner TEXT, winnerScore INTEGER)");
});