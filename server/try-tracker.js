var debug = require('debug')('app:try-tracker');
var hasValue = require('../hasValue');
var _ = require('underscore');

var TRY_TIMEOUT = 15 * 1000;

var TryTracker = function(onDump, onTryEnd) {

    this.onDump = onDump || function() {};
    this.onTryEnd = onTryEnd || function() {};

    this.players = {};
    this.currentTry = [];
    this.isTryRunning = false;
    this.tryStartTime = null;

    this.interval = null;
    this.timeout = null;
}

TryTracker.prototype.pushData = function(nickname, dps) {
    dps = parseInt(dps);

    if (!this.isTryRunning) {
        this.startTry();
    }

    this.resetTimeout();

    if (!hasValue(this.players[nickname])) {
        this.players[nickname] = 0;
    }

    this.players[nickname] = dps;
}


TryTracker.prototype.dump = function(timestamp) {
    debug('Dump current progress.');
    this.currentTry.push({
        players: _.clone(this.players),
        timestamp: timestamp
    });

    var currentTryLength = this.currentTry.length
    if (currentTryLength >= 2) {
        var previousProgress = this.currentTry[currentTryLength - 2];
        var currentProgress = this.currentTry[currentTryLength - 1];
        this.onDump(previousProgress, currentProgress);
    }
}


TryTracker.prototype.startTry = function() {
    debug('Start new try.');

    this.isTryRunning = true;
    this.tryStartTime = Date.now();
    this.interval = setInterval(function() {
        this.dump(Date.now() - this.tryStartTime);
    }.bind(this), 1000);
}


TryTracker.prototype.stopTry = function() {
    var duration = Date.now() - this.tryStartTime - TRY_TIMEOUT;
    debug('End of try (duration of %d).', duration);

    clearInterval(this.interval);
    this.interval = null;
    this.isTryRunning = false;

    this.onTryEnd(_.clone(this.currentTry));

    this.players = {};
    this.currentTry = [];
}


TryTracker.prototype.resetTimeout = function() {
    if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    if (this.isTryRunning) {
        this.timeout = setTimeout(this.stopTry.bind(this), TRY_TIMEOUT);
    }
}


module.exports = TryTracker;
