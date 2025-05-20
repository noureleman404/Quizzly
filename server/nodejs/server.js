const http = require('http')
const {app} = require('./app')
const PORT = 3000;
const server = http.createServer(app);

const {pool , database } = require('./databaseConf');
const { setDefaultResultOrder } = require('dns');

async function startServer() {
    await pool.connect().then(() => {
        console.log("Connected to database !");
    }).catch((err) => {
        console.log("Error Connecting to database");
        process.exit(1);
    })

    server.listen(PORT  , "0.0.0.0" , () => {
        console.log(`Listening on Port ${PORT} .`);
    })
}
startServer()