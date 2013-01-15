/*
 * volume.js: Instance of a rackspace cloud block storage volume
 *
 * (C) 2012 Clipboard, Inc.
 *
 * MIT LICENSE
 *
 */
var Volume = function(client, details) {
    if (!details) {
        throw new Error("Volume must be constructed with at-least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

Volume.prototype = {
    /**
     * @name Volume.getDetails
     * @description Update the details of this volume
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.client.getVolume(this.id, function(err, flavor) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(flavor);
            callback(null, self);
        });
    },

    /**
     * @name Volume.setWait
     * @description Continually polls Rackspace Cloud BlockStorage and checks the
     * results against the attributes parameter. When the attributes match
     * the callback will be fired.
     *
     * @param {Object}      attributes  the value to check for during the interval
     * @param {Object}      options    timeout in ms
     * @param {Function}    callback    handles the callback of your api call
     */
    setWait: function(attributes, options, callback) {
        var self = this,
            calledBack = false;

        var equalCheckId = setInterval(function() {

            self.getDetails(function(err, server) {
                if (err) return; // Ignore errors

                if (options.update) {
                    options.update();
                }

                var equal = true, keys = Object.keys(attributes);
                for (var index in keys) {
                    if (attributes[keys[index]] !== server[keys[index]]) {
                        equal = false;
                        break;
                    }
                }

                if (equal && !calledBack) {
                    finalize(null);
                }
                else if (calledBack) {
                    clearInterval(equalCheckId);
                }
            });
        }, options.interval);

        setTimeout(function() {
            if (!calledBack) {
                finalize({ error: 'Max timeout exceeded' });
            }
        }, options.maxWait ? options.maxWait * 1000 : 60 * 30 * 1000);

        function finalize(err) {
            calledBack = true;
            clearInterval(equalCheckId);
            if (options.finish) {
                options.finish();
            }
            callback(err, self);
        }

        return equalCheckId;
    },

    /**
     * @name Volume.clearWait
     * @description  Clears a previously setWait for this instance
     * @param {Number}      intervalId      the interval to clear
     */
    clearWait: function(intervalId) {
        clearInterval(intervalId);
    },

    /**
     * @name Volume._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.display_name = details.display_name;
        this.display_description = details.display_description;
        this.size = details.size;
        this.status = details.status;
        this.volume_type = details.volume_type;
        this.snapshot_id = details.snapshot_id;
        this.attachments = details.attachments;
        this.created_at = details.created_at;
        this.availability_zone = details.availability_zone;
        this.metadata = details.metadata;
    }
};

exports.Volume = Volume;

exports.VolumeType = {
    SSD: 'SSD',
    SATA: 'SATA'
};