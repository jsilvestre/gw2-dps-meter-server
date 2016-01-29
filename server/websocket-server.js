var debug = require('debug')('app:websocket-server');

module.exports = function(io) {

    io.on('connection', function(socket){
        debug('A client connected.')

        socket.on('disconnect', function() {
            debug('A client disconnected.')
        });
    });

    return io.emit.bind(io);
}
