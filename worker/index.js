const keys = require("./keys");
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(n, memo=[]){
    if(memo[n] !== undefined) return memo[n];
    if(n < 2) return 1;
    let res =  fib(index - 1,memo) + fib(index - 2,memo);
    memo[n] = res;
    return res;
}

sub.on('message',(channel,message) =>{
    redisClient.hset('values',message,fib(parseInt(message)));
});

sub.subscribe('insert');