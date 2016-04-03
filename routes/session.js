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
        res.render(loginLocation, { title: 'Login',message:'',pubKey:encryption.servePublicKey(), username: req.session.user.username, isAdmin: req.session.user.admin});
    },

    create:function(req,res){
        //console.log('in create');
        //console.log(req.body);
        var encrypted = req.body.encrypted;
        //console.log('encrypted = ',encrypted);
        var decrypted = encryption.asymDecrypt(encrypted);
        //console.log(decrypted);

        db.get("SELECT * from Users WHERE username = ?", decrypted.username, function(err,user){
            if(err || !user)
                return res.render(loginLocation,{title: 'Login', invalid: true, message:"Username/Password not found. Please try again.", pubKey:encryption.servePublicKey(), username: req.session.user.username, isAdmin: req.session.user.admin});
            var digest = encryption.hash(decrypted.password, user.salt);
            if(user.passwordDigest !== digest)
                return res.render(loginLocation,{title: 'Login', invalid: true, message:"Username/Password not found. Please try again.", pubKey:encryption.servePublicKey(), username: req.session.user.username, isAdmin: req.session.user.admin});
            req.session.reset();
            req.session.user = user;
            console.log(user.username, " has logged in.");
            return res.render('index', {title: "Home Page", username: req.session.user.username, isAdmin: req.session.user.admin});
        });
    },

    destroy: function(req, res){
        req.session.reset();
        req.session.user = {username: "Guest", isAdmin: false};
        res.render('login', { success: true, message: "You have logged out!", pubKey:encryption.servePublicKey(), username: req.session.user.username, isAdmin: req.session.user.admin})
    },

    loadUser: function(req, res, next){
        console.log("HERE", req.session.user);
        if(req.session && req.session.user && req.session.user.username != "Guest"){
            db.get("SELECT * from Users WHERE username = ?", req.session.user.username, function(err,user){
                if(err){
                    //return res.render("error", { error: err});
                    return res.sendStatus(500);
                }

                req.user = user;
                req.session.user = user;
                console.log("Loading user: ",user);
                return next();
            });
        }
        else{
            req.user = {username:"Guest", isAdmin: false};
            req.session.user = {username:"Guest", isAdmin: false};
            next();
        }
    }
};

module.exports = exports = Session;