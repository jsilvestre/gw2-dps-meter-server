var debug = require('debug')('app:web-server');
var express = require('express');
var path = require('path');

module.exports = function(host, port) {

    debug('Initialize HTTP server.');

    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);

    app.use(express.static(path.resolve(__dirname, '..', 'public')));

    http.listen(port, host, function() {
        debug('HTTP server listening on port %s:%d.', host, port);
    });

    return io;
}
