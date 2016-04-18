/**
 * Created by Matt on 3/24/2016.
 */
var crypto = require('crypto'),
    nodeRSA = require('node-rsa'),
    fs = require('fs');

const symmAlgorithm = 'aes-256-ctr';
const signAlgorithm = 'RSA-SHA256';
const hashAlgorithm = 'sha256';
//secret vars needs to be declared here
var secret = "";
const secretFile = "./authentication/secret.txt";
var tinyCipher = crypto.createCipher(symmAlgorithm, getSecret());
var tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());

//path location of keys
const privFile = "./authentication/privKey.txt";
const pubFile = "./authentication/pubKey.txt";
const symmFile = "./authentication/symmKey.txt";

//loads or generates keys
fs.access(privFile, fs.F_OK, function(err){
    if(err) seed();
});

const asymPEMKeyType = 'utf-8';
const keyStoreType = 'base64'; //must be binary, base64, or hex
const pubImportType = 'pkcs8-public-pem';
const privImportType = 'pkcs1-private-pem';

function seed() {
    //generate and save symmetric key
    var symmKey = crypto.randomBytes(256);
    console.log("Symmetric Key : ",symmKey.toString('base64'));

    var symmKeySave = tinyCipher.update(symmKey,'binary',keyStoreType);
    symmKeySave += tinyCipher.final(keyStoreType);

    fs.writeFileSync(symmFile,symmKeySave,keyStoreType);

    //generate asymmetric public and private keys
    var key = new nodeRSA({b:2048});

    //extract and save public key
    var pubKeyPEM = key.exportKey(pubImportType);
    console.log("Public Key : " ,pubKeyPEM);

    tinyCipher = crypto.createCipher(symmAlgorithm, getSecret());
    var pubKeySave = tinyCipher.update(pubKeyPEM,asymPEMKeyType,keyStoreType);
    pubKeySave += tinyCipher.final(keyStoreType);

    fs.writeFileSync(pubFile,pubKeySave,keyStoreType);

    //extract and save private key
    var privKeyPEM = key.exportKey(privImportType);
    console.log("Private Key : " ,privKeyPEM);

    tinyCipher = crypto.createCipher(symmAlgorithm, getSecret());
    var privKeySave = tinyCipher.update(privKeyPEM,asymPEMKeyType,keyStoreType);
    privKeySave += tinyCipher.final(keyStoreType);

    fs.writeFileSync(privFile,privKeySave,keyStoreType);
}
function seedSecret(){
    //generate and save secret
    var secretKey = createSecret();
    console.log("Secret: ", secretKey);

    fs.writeFileSync(secretFile,secretKey,'utf8');
}

function getSymmmetric(){
    //read the encrypted key
    var symmKeySave = fs.readFileSync(symmFile,keyStoreType);

    //decipher the symmetric key
    var symmKey = tinyDecipher.update(symmKeySave,keyStoreType,'base64');
    symmKey += tinyDecipher.final('base64');
    return symmKey;
}

function getPublic(){
    //create empty key
    var pubKey = new nodeRSA();

    //read the encrypted key
    var pubKeySave = fs.readFileSync(pubFile,keyStoreType);

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);

    pubKey.importKey(pubKeyPEM,pubImportType);

    return pubKey;
}

function getPublicPem(){
    //read the encrypted key
    var pubKeySave = fs.readFileSync(pubFile,keyStoreType);

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);

    return pubKeyPEM;
}

function getPrivate() {
    //create empty key
    var privKey = new nodeRSA();

    //read the encrypted key
    var privKeySave = fs.readFileSync(privFile,keyStoreType);

    //decipher and store the private key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var privKeyPEM = tinyDecipher.update(privKeySave,keyStoreType,asymPEMKeyType);
    privKeyPEM += tinyDecipher.final(asymPEMKeyType);

    privKey.importKey(privKeyPEM,privImportType);

    return privKey;
}

function getPrivatePEM() {

    //read the encrypted key
    var privKeySave = fs.readFileSync(privFile,keyStoreType);

    //decipher and store the private key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var privKeyPEM = tinyDecipher.update(privKeySave,keyStoreType,asymPEMKeyType);
    privKeyPEM += tinyDecipher.final(asymPEMKeyType);

    /*
    Uncomment this line to print your server's private key.
    Used for generating https certificate
     */
    //console.log(privKeyPEM);

    return privKeyPEM;
}

/*
 Gets the secret, seeds if doesn't exist.
 */
function getSecret() {
    if (secret === null || secret === undefined || secret === ""){
        try {
            secret = fs.readFileSync(secretFile, 'utf8');
            return getSecret();
        } catch(e) {
            if (e.code === 'ENOENT') { //code for file not found
                seedSecret();
                return getSecret();
            }
            else { //any other error
                throw e;
            }
        }
    }
    else {
        return secret;
    }
}

function createSecret() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!#$%^&*()_-+=";

    for( var i=0; i < 24; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
/*
function loadKeys(){




    //decipher the symmetric key
    symmKey = tinyDecipher.update(symmKeySave,keyStoreType,'base64');
    symmKey += tinyDecipher.final('base64');

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);
    console.log("Public Key Recovered: ", pubKeyPEM);

    pubKey.importKey(pubKeyPEM,pubImportType);

    //decipher and store the private key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,getSecret());
    var privKeyPEM = tinyDecipher.update(privKeySave,keyStoreType,asymPEMKeyType);
    privKeyPEM += tinyDecipher.final(asymPEMKeyType);
    console.log("Private Key Recovered: ", privKeyPEM);

    privKey.importKey(privKeyPEM,privImportType);
}
*/

var Encryption = {
    servePublicKey:function(){
        return getPublicPem();
    },

    servePrivKey:function(){
        return getPrivatePEM()
    },

    serveSymmKey:function(){
        try{
            return getSymmmetric();
        }
        catch(err){
            seed();
            return getSymmmetric();
        }
    },

    //signs a piece of data with the private key
    signData:function(data){
        var privKey = getPrivate();
        var sig = privKey.sign(data,'base64');
        return sig;
        //verify with pubKey.verify(data, sig,'utf8','base64')
    },

    asymDecrypt:function(encrypted){
        var privKey = getPrivate();
        //console.log(encrypted);
        var decrypted = privKey.decrypt(encrypted,'json');
        return decrypted;
    },

    symmEncrypt:function(plaintext){
        var symmKey = getSymmmetric();
        var cipher = crypto.createCipher(symmAlgorithm,symmKey);

        var encrypted = cipher.update(plaintext,'utf8','base64');
        encrypted += cipher.final('base64');

        return encrypted;
    },

    symmDecrypt:function(encrypted){
        var symmKey = getSymmmetric();
        var decipher = crypto.createDecipher(symmAlgorithm,symmKey);

        var plaintext = decipher.update(encrypted,'base64','utf8');
        plaintext += decipher.final('utf8');

        return plaintext;
    },

    salt:function() {
        return crypto.randomBytes(32).toString('utf8').slice(0,32);
    },

    // Creates a cryptographic hash of the provided
    // plaintext, with additional salt using a module
    // specific secret
    hash:function(plaintext, salt) {
        var hash = crypto.createHash(hashAlgorithm);
        hash.update(plaintext+ salt, 'utf8');
        return hash.digest('base64');
    }
};

module.exports = exports = Encryption;
