var fs = require('fs');
var path = require('path');
//NOTE: The format i've been following goes as follows
// Title, by Author
//
// Challenge
var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};
walk('challenges', function(err, results) {
    if(err) throw err;

    var challenges = [];

    results.forEach(function(file, index, array){
        fs.readFile(file, "utf8", function(err, data){
            if (err) throw err;
            readLines(data, challenges, index+1 === array.length);
        });
    });
});

function writeJSON(challenges){
    fs.writeFile('./challenges.json', JSON.stringify(challenges), 'utf-8', function(err){
        if (err) throw err;
    });
}

function readLines(data, challenges, done){
    var challengeObject = {
        title : "",
        author : "",
        challenge : ""
    };
    data = data.split("\n");
    for(var i = 0; i < data.length; i++) {
        if(i == 0){
            var split = data[i].split(',');
            challengeObject.title = split[0];
            challengeObject.author = split[1].substring(4, split[1].length);
        }
        else if(data[i] == ''){ //ignore blank lines, avoids having multiple spaces between words
            continue;
        }
        else{
            challengeObject.challenge += data[i] + " ";
        }
        if(i+1 == data.length){
            challenges = insertObject(challenges, challengeObject, done);
        }
    }
}

function insertObject(challenges, challengeObject, done){
    challenges.push(challengeObject);
    if(done){
        writeJSON(challenges);
    }
    return challenges;
}

