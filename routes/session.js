/**
 * Created by Matt on 3/26/2016.
 */
var encryption = require('../authentication/encryption'),
    db = require('../database/db');

var loginLocation = 'login';
var logOutLocation = 'logout';

var Session = {
    new:function(req, res){
        //req.session.publicKey = encryption.servePublicKey();
        res.render(loginLocation, { title: 'Login',message:'',pubKey:encryption.servePublicKey()});
    },

    create:function(req,res){
        req.session.reset();
        //console.log('in create');
        //console.log(req.body);
        var encrypted = req.body.encrypted;
        //console.log('encrypted = ',encrypted);
        var decrypted = encryption.asymDecrypt(encrypted);
        //console.log(decrypted);

        db.get("SELECT * from Users WHERE username = ?", decrypted.username, function(err,user){
            if(err || !user)
                return res.render(loginLocation,{title: 'Login', invalid: true, message:"Username/Password not found. Please try again.", pubKey:encryption.servePublicKey()});
            var digest = encryption.hash(decrypted.password, user.salt);
            if(user.passwordDigest !== digest)
                return res.render(loginLocation,{title: 'Login', invalid: true, message:"Username/Password not found. Please try again.", pubKey:encryption.servePublicKey()});
            req.session.user = user.username;
            console.log(user.username, " has logged in.");
            res.render('index', {
                title: "Home Page",
                personalMessage: "Welcome, "+ user.username,
                user: user.username
            });
            //return res.redirect('/');
        });
    },

    destroy:function(req, res){
        req.session.reset();
        res.render(logOutLocation, {user: {username:"Guest"}});
    },

    loadUser: function(req, res, next){
        if(req.session && req.session.user){
            db.get("SELECT * from Users WHERE username = ?", req.session.user, function(err,user){
                if(err) return res.sendStatus(500);
                req.user = user;
                //console.log("Loading user: ",user);
                return next();
            });
        }
        else{
            req.user = {username:"Guest"};
            next();
        }
    }
};

module.exports = exports = Session;