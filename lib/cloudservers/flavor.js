/*
 * flavor.js: Instance of a single rackspace openstack flavor
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */
var Flavor = function(client, details) {
    if (!details) {
        throw new Error("Flavor must be constructed with at-least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

Flavor.prototype = {
    /**
     * @name Flavor.getDetails
     * @description Update the flavor details for this instance
     * @param {Function} callback handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.client.getFlavor(this.id, function(err, flavor) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(flavor);
            callback(null, self);
        });
    },

    /**
     * @name Flavor._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object} details the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.name = details.name;
        this.ram = details.ram;
        this.swap = details.swap;
        this.vcpus = details.vcpus;
        this.disk = details.disk;
    }
};

exports.Flavor = Flavor;