/**
 * Created by Matt on 3/26/2016.
 */
var encryption = include('../authentication/encryption'),
    formidable = include('formidable');

var loginLocation = 'login.html';
var logOutLocation = 'logout.html';

var Session = {
    new:function(req, res){
        req.session.publicKey = encryption.servePublicKey();
        res.render(loginLocation, {message:'',user:req.user, pubKey:req.session.publicKey});
    },

    create:function(req,res){
        req.session.reset();
        req.session.publicKey = encryption.servePublicKey();
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files){
            var encrypted = fields.encrypted;
            var decrypted = encryption.asymDecrypt(encrypted);
            console.log(decrypted);

            db.get("SELECT * from users WHERE username = ?", decrypted.username, function(err,user){
                if(err || !user)
                    return res.render(loginLocation,{message:"Username/Password not found. Please try again.", user:req.user, pubKey:req.session.publicKey});
                var digest = encryption.hash(decrypted.password, user.salt);
                if(user.passwordDigest !== digest)
                    return res.render(loginLocation,{message:"Username/Password not found. Please try again.", user:req.user, pubKey:req.session.publicKey});
                req.session.user = user.username;
                console.log(req.session.user, " has logged in.");
                return res.redirect('/index');
            });
        })
    },

    destroy:function(req, res){
        req.session.reset();
        res.render(logOutLocation, {user: {username:"Guest"}});
    }
};

function loadUser(req, res, next){
    if(req.session && req.session.user){
        db.get("SELECT * from users WHERE username = ?", req.session.user, function(err,user){
            if(err) return res.sendStatus(500);
            req.user = user;
            return next();
        });
    }
    else{
        req.user = {username:"Guest"};
        next();
    }
}

module.exports = exports = Session;