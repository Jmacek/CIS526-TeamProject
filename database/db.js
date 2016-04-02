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
        // Drop table if it exists
        db.run("DROP TABLE IF EXISTS Tasks");
        db.run("CREATE TABLE Tasks (taskID INTEGER PRIMARY KEY, content TEXT, timesUsed INTEGER, title TEXT)");

        //Log contents of the Tasks table to the console
        db.each("SELECT * FROM Tasks", function(err, row){
            if(err) return console.error(err);
            console.log(row);
        });

        //Drop table if exists
        db.run("DROP TABLE IF EXISTS Users");
        db.run("CREATE TABLE Users (userID INTEGER PRIMARY KEY, username TEXT UNIQUE, passwordDigest TEXT, salt TEXT, admin BOOLEAN)");

        //Drop table if exists
        db.run("DROP TABLE IF EXISTS Challenges");
        db.run("CREATE TABLE Challenges(ID INTEGER PRIMARY KEY, player1 TEXT, player2 TEXT, winner TEXT, task1 TEXT, task2 TEXT, task3 TEXT)");
    });
}

module.exports = exports = db;