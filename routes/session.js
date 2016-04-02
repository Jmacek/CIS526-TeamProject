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
            req.app.locals.username = user.username;
            req.app.locals.isAdmin = user.isAdmin;
            res.render('index', {
                title: "Home Page"
            });
            //return res.redirect('/');
        });
    },

    destroy: function(req, res){
        req.session.reset();
        req.app.locals.username = "Guest";
        req.app.locals.isAdmin = false;
        res.render('login', { success: true, message: "You have logged out!", pubKey:encryption.servePublicKey()})
    },

    loadUser: function(req, res, next){
        if(req.session && req.session.user){
            db.get("SELECT * from Users WHERE username = ?", req.session.user, function(err,user){
                if(err) return res.sendStatus(500);
                req.user = user;
                console.log("Loading user: ",user);
                req.app.locals.username = user.username;
                req.app.locals.isAdmin = user.isAdmin;
                return next();
            });
        }
        else{
            console.log("Inside guest");
            req.user = {username:"Guest"};
            //res.render(req.url.split("/").pop(), {user: "Guest", isAdmin: false});
            next();
        }
    }
};

module.exports = exports = Session;