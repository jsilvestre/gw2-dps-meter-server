var debug = require('debug')('app:analyzer');
var _ = require('underscore');

// Compute the percentage of the variage between two data.
function getVariation(a, b) {
    var variation = (b - a) / a;
    return variation * 100;
}


    // Reduce one try array to the average DPS of a given player.
function averageDPSPlayerReducer(player, previous, item) {
    if (previous === 0) {
        // Base value is first value of player, default to 0 if there is
        // no data yet for given player.
        return item.players[player] || 0;
    } else {
        // Compute the average DPS.
        return (previous + item.players[player]) / 2;
    }
}

function averageDPSGroupReducer(previous, item) {
    var playerNames = Object.keys(item.players);
    var sum = 0;
    for(var i = 0; i < playerNames.length; i++) {
        sum += item.players[playerNames[i]];
    }
    if (previous === 0) {
        return sum;
    } else {
        return (previous + sum) / 2;
    }
}

// Get the DPS variation between two try for a given player.
function compareTryForPlayer(player, try1, try2) {

    // Get the average DPS for the two try to compare for the given player.
    var reducer = averageDPSPlayerReducer.bind(null, player);
    var averageDPSOnTry1 = try1.reduce(reducer, 0);
    var averageDPSOnTry2 = try2.reduce(reducer, 0);

    // Compute the variation% between both value.
    var variation = getVariation(averageDPSOnTry1, averageDPSOnTry2);
    return Math.round(variation * 100) / 100;
}

// Get the DPS variation between two try for the group.
function compareTryForGroup(try1, try2) {

    var averageDPSOnTry1 = try1.reduce(averageDPSGroupReducer, 0);
    var averageDPSOnTry2 = try2.reduce(averageDPSGroupReducer, 0);

    var variation = getVariation(averageDPSOnTry1, averageDPSOnTry2);
    return Math.round(variation * 100) / 100;
}

function extractPlayersList(currentTry) {
    var playersList = currentTry.map(function(progress) {
        return Object.keys(progress.players);
    }).reduce(function(previous, item) {
        return previous.concat(item);
    }, []);

    return _.uniq(playersList);
}

var Analyzer = function(emit) {
    this.emit = emit;

    this.history = [];
}

Analyzer.prototype.onDump = function(previous, current) {

    var previousPlayers = Object.keys(previous.players);

    for(var i = 0; i < previousPlayers.length; i++) {
        var player = previousPlayers[i];
        var relativeDiff = getVariation(previous.players[player], current.players[player]);
        //var output = 'Variation for ' + player + ': ' + relativeDiff + '%';
        //debug(output);
    }
}

Analyzer.prototype.onEndTry = function(currentTry) {

    this.history.push(currentTry);

    var summary = {
        dpsGroup: '',
        dpsPlayers: []
    };

    debug('---- DPS Summary ----');

    var groupDPS = currentTry.reduce(averageDPSGroupReducer, 0);
    groupDPS = Math.round(groupDPS * 100) / 100;

    var previousTry = null;
    if (this.history.length >= 2) {
        previousTry = this.history[this.history.length - 2];
    }

    var variation;
    var appendix = ''
    if (previousTry) {
        variation = compareTryForGroup(previousTry, currentTry)
        appendix = ' (' + variation + '%)';
    }

    var message;
    message = 'Group had average DPS of ' + groupDPS + appendix
    debug(message);
    summary.dpsGroup = message;

    var playersList = extractPlayersList(currentTry);
    var player, dps;
    for (var i = 0; i < playersList.length; i++) {
        player = playersList[i];
        dps = currentTry.reduce(averageDPSPlayerReducer.bind(null, player), 0);
        dps = Math.round(dps * 100) / 100;

        if (previousTry) {
            variation = compareTryForPlayer(player, previousTry, currentTry)
            appendix = ' (' + variation + '%)';
        } else {
            appendix = ''
        }

        message = player + ' had average DPS of ' + dps + appendix
        debug(message);
        summary.dpsPlayers.push(message);
    }

    this.emit('summary', summary);
}

module.exports = Analyzer;
