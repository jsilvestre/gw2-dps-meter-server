window.onload = function() {
    var socket = io();

    var result = $('#result');

    socket.on('summary', function(data) {
        console.log('got data');
        console.log(data);

        result.empty();
        result.append('<p>' + data.dpsGroup + '</p>')

        for (var i = 0; i < data.dpsPlayers.length; i++) {
            result.append('<p>' + data.dpsPlayers[i] + '</p>')
        }
    });
}
