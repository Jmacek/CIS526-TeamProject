Typing War
===

Play with friends and compete for the most points.

### Environment setup

To set up your environment, install nodeJS, downoad this repo, and run

    apm install
  
  **Note:** If you get an error about Sqlite3 when running this command, I would suggest removing that depenency from package.json, then   running the command again. After it succesfully downloads and installs, then run `npm install sqlite3`

If everything is succesful, you should be able to launch the app by running
    npm start

### Accessing the WebService

**development**

- Home -- http://localhost:8081/
- Login -- http://localhost:8081/login
- Challange -- http://localhost:8081/challenge
- Scoreboard -- http://localhost:8081/scoreboard
- Register -- http://localhost:8081/register
