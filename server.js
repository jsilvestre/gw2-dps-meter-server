/*
    HOW TO TEST:
    $ netcat localhost 1234
*/

var host = process.env.HOST || '0.0.0.0';
var webServerPort = process.env.WEB_SERVER_PORT || 3000;
var dpsMeterServerPort = process.env.DPS_METER_SERVER_PORT || 1234;

webServer = require('./server/web-server');
websocketSever = require('./server/websocket-server');
dpsMeterServer = require('./server/dps-meter-server');

var io = webServer(host, webServerPort);
var emit = websocketSever(io);
dpsMeterServer(host, dpsMeterServerPort, emit);

