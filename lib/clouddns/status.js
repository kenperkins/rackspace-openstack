/*
 * status.js: Instance of a rackspace async api call
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
 *
 * MIT LICENSE
 *
 */
var Status = function(client, details) {
    if (!details) {
        throw new Error('Status must be constructed with at-least basic details.')
    }

    this.client = client;
    this._setProperties(details);
};

Status.prototype = {

    endpoint: {
        type: 'rax:dns',
        name: 'cloudDNS'
    },

    /**
     * @name Status.getDetails
     *
     * @description Update the Status details for this instance
     *
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/status/' + self.id,
            qs: { showDetails: true },
            endpoint: self.endpoint
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(body);
            callback(err, self);
        });
    },

    waitForResult: function(options, callback) {
        var self = this;

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        if (!options.interval || options.interval < 0) {
            options.interval = 5000;
        }

        // TODO check for multiple failures and exit out
        var equalCheckId = setInterval(function() {

            self.getDetails(function(err) {
                if (err) return; // Ignore errors

                if (self.status === 'RUNNING' || self.status === 'INITIALIZED') {
                    return;
                }

                clearInterval(equalCheckId);
                callback(null, self);

            });
        }, options.interval);

        return equalCheckId;
    },

    /**
     * @name Server.clearWait
     * @description  Clears a previously setWait for this instance
     * @param {Number}      intervalId      the interval to clear
     */
    clearWait: function(intervalId) {
        clearInterval(intervalId);
    },

    /**
     * @name Status._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.jobId;
        this.status = details.status;
        this.response = details.response;
    }
};

exports.Status = Status;