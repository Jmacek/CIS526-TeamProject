/**
 * Created by Matt on 3/24/2016.
 */
var crypto = require('crypto'),
    nodeRSA = require('node-rsa'),
    fs = require('fs');

const secret = "sgb879ash*&S^FhsfSD!@sh";
const symmAlgorithm = 'aes-256-ctr';
const signAlgorithm = 'RSA-SHA256';
const hashAlgorithm = 'sha256';
var tinyCipher = crypto.createCipher(symmAlgorithm, secret);
var tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);

//loads or generates keys
fs.access('privKey.txt', fs.F_OK, function(err){
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

    fs.writeFileSync('symmKey.txt',symmKeySave,keyStoreType);

    //generate asymmetric public and private keys
    var key = new nodeRSA({b:2048});

    //extract and save public key
    var pubKeyPEM = key.exportKey(pubImportType);
    console.log("Public Key : " ,pubKeyPEM);

    tinyCipher = crypto.createCipher(symmAlgorithm, secret);
    var pubKeySave = tinyCipher.update(pubKeyPEM,asymPEMKeyType,keyStoreType);
    pubKeySave += tinyCipher.final(keyStoreType);

    fs.writeFileSync('pubKey.txt',pubKeySave,keyStoreType);

    //extract and save private key
    var privKeyPEM = key.exportKey(privImportType);
    console.log("Private Key : " ,privKeyPEM);

    tinyCipher = crypto.createCipher(symmAlgorithm, secret);
    var privKeySave = tinyCipher.update(privKeyPEM,asymPEMKeyType,keyStoreType);
    privKeySave += tinyCipher.final(keyStoreType);

    fs.writeFileSync('privKey.txt',privKeySave,keyStoreType);
}

function getSymmmetric(){
    //read the encrypted key
    var symmKeySave = fs.readFileSync('symmKey.txt',keyStoreType);

    //decipher the symmetric key
    var symmKey = tinyDecipher.update(symmKeySave,keyStoreType,'base64');
    symmKey += tinyDecipher.final('base64');
    return symmKey;
}

function getPublic(){
    //create empty key
    var pubKey = new nodeRSA();

    //read the encrypted key
    var pubKeySave = fs.readFileSync('pubKey.txt',keyStoreType);

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);

    pubKey.importKey(pubKeyPEM,pubImportType);

    return pubKey;
}

function getPublicPem(){
    //read the encrypted key
    var pubKeySave = fs.readFileSync('pubKey.txt',keyStoreType);

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);

    return pubKeyPEM;
}

function getPrivate() {
    //create empty key
    var privKey = new nodeRSA();

    //read the encrypted key
    var privKeySave = fs.readFileSync('privKey.txt',keyStoreType);

    //decipher and store the private key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);
    var privKeyPEM = tinyDecipher.update(privKeySave,keyStoreType,asymPEMKeyType);
    privKeyPEM += tinyDecipher.final(asymPEMKeyType);

    privKey.importKey(privKeyPEM,privImportType);

    return privKey;
}
/*
function loadKeys(){




    //decipher the symmetric key
    symmKey = tinyDecipher.update(symmKeySave,keyStoreType,'base64');
    symmKey += tinyDecipher.final('base64');

    //decipher and store the public key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);
    var pubKeyPEM = tinyDecipher.update(pubKeySave,keyStoreType,asymPEMKeyType);
    pubKeyPEM += tinyDecipher.final(asymPEMKeyType);
    console.log("Public Key Recovered: ", pubKeyPEM);

    pubKey.importKey(pubKeyPEM,pubImportType);

    //decipher and store the private key
    tinyDecipher = crypto.createDecipher(symmAlgorithm,secret);
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

    //signs a piece of data with the private key
    signData:function(data){
        var privKey = getPrivate();
        var sig = privKey.sign(data,'base64');
        return sig;
        //verify with pubKey.verify(data, sig,'utf8','base64')
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
