Typing War
===

Play with friends and compete for the most points.

### Environment setup

To set up your environment, install nodeJS(I would use nvm if you're on linux having trouble with versioning), downoad this repo, and run

    npm install
  
  **Note:** If you get an error about Sqlite3 when running this command, I would suggest removing that depenency from `package.json`, then   running the command again. After it succesfully downloads and installs, then run `npm install sqlite3 --save`

If everything is succesful, you should be able to launch the app by running

    npm start

### Http and Https

By default, this will app will listen as an http server.

If you would like to encrypt your site traffic, do the following:
- Get your server's private key by uncommenting the line in the getPrivatePEM() function in authentication/encryption.js
- Use openssl to create your certificate as defined here: http://www.akadia.com/services/ssh_test_certificate.html
- Include your signed certificate in the authentication folder as "server.csr"
- Be sure to re comment-out the line in the getPrivatePEM() function!

### Accessing the WebService

**development**
If you have a CRT you can use https, if not http should work.
- Home -- https://localhost:8081/
- Login -- https://localhost:8081/login
- Challange -- https://localhost:8081/challenge
- Scoreboard -- https://localhost:8081/scoreboard
- Register -- https://localhost:8081/register
