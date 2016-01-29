var Analyzer = require('./analyzer');
var debug = require('debug')('app:dps-meter-server');
var hasValue = require('../hasValue');
var net = require('net');
var TryTracker = require('./try-tracker');

var NUM_MAX_CLIENT = 10;
var numSockets = 0;

function onReceiveData(pushData, buffer) {
    var data = buffer.toString();
    var structuredData = data
        .split(': ')
        .map(function(item) {
            return item.trim();
        });
    if(hasValue(structuredData[0]) && hasValue(structuredData[1])) {
        pushData(structuredData[0], structuredData[1]);
    } else {
        debug("Data received don't have the proper format");
    }
}


function onSocketClosed() {
    debug('Client closed connection.');
    numSockets--;
}


function onSocketError(error) {
    debug('An error occured:');
    debug(error);
}


function onSocketConnect(pushData, socket) {
    debug('Client connected to server.');

    socket.on('error', onSocketError);

    if (numSockets === NUM_MAX_CLIENT) {
        var message = 'There are too much clients already. Limited ' +
                      'to ' + NUM_MAX_CLIENT + '. Connection rejected.';
        debug(message);
        socket.end(message);
    } else {
        debug('Client accepted to server.');
        numSockets++;
        socket.on('data', onReceiveData.bind(null, pushData));
        socket.on('close', onSocketClosed);
    }
}


module.exports = function(host, port, emit) {
    debug('Initialize DPS Meter server.');

    var analyzer = new Analyzer(emit);

    setTimeout(function() {
        var fs = require('fs');
        var path = require('path');
        data1 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../progress.json')));
        data2 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../progress2.json')));
        analyzer.onEndTry(data1);
        analyzer.onEndTry(data2);
    }, 1000);

    var onDump = analyzer.onDump.bind(analyzer);
    var onEndTry = analyzer.onEndTry.bind(analyzer);
    var tryTracker = new TryTracker(onDump, onEndTry);

    var pushData = tryTracker.pushData.bind(tryTracker);
    var server = net.createServer(onSocketConnect.bind(null, pushData));

    server.listen(port, host, function() {
        debug('DPS Meter server listening on %s:%d.', host, port);
    });
}
