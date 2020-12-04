const keys = require("./keys");

//Express app setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app  = express();
app.use(cors());
app.use(bodyParser.json());

//Postgres client setup
const {Pool} = require('pg');
const pgClient = new Pool({
    user:keys.pgUser,
    host:keys.pgHost,
    database:keys.pgDataBase,
    password:keys.pgPassword,
    port:keys.pgPort
});

pgClient.on('error', () => console.log('Lost PG Connection'));
pgClient.query('CREATE TABLE IF NOT EXISTS values(number INT)')
        .catch(err => console.log(err));

// More express API setup

const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// Express Route handlers
app.get("/",(req,res) =>{
    res.send('HI There!');
});

app.get("/values/all", async (req,res)=>{
    try{
        const values = await pgClient.query('SELECT * FROM values');
        res.send(values.rows);
    }catch(err){
        console.log(err);
        res.send('Error');
    }
});

app.get('/values/current', async (req,res) =>{
    redisClient.hgetall('values',(err,values) =>{
        res.send(values);
    })
})

app.post("/values",async (req,res) =>{
    const index = req.body.index;
    redisClient.hset('values',index,'Nothing Yet');
    redisPublisher.publish('insert',index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    res.send({working:true});
});

app.listen(5000, () => console.log('Listening to port 5000'));
//
