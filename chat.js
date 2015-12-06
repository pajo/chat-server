'use strict';

var Primus = require('primus');

var server = Primus.createServer(function connection(spark) {

}, { port: 8080, transformer: 'websockets' });

console.log(`Started chat server on port ${ server.options.port }`);