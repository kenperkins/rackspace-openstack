/*
 * network.js: Instance of a single private (or public) Cloud Network
 *
 * (C) 2013 Andrew Regner
 *
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

var Network = function(client, details) {
    if (!details) {
        throw new Error("Network must be constructed with at-least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

Network.prototype = {
    /**
     * @name Network.destory
     * @description deletes this cloud network
     * @param {Function}    callback    handles the callback of your api call
     */
    destroy: function(callback) {
        // We can't get delete the predefined networks
        if (_.include([rackspace.PublicNet.id, rackspace.ServiceNet.id], this.id)) {
            throw new Error('Cannot delete predefined network.');
        }

        this.client.destroyNetwork(this, callback);
    },

    /**
     * @name Network._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.cidr = details.cidr;
        this.label = details.label;
    }
};

exports.Network = Network;

exports.PublicNet = new Network(null, {id: "00000000-0000-0000-0000-000000000000", label: "public"});
exports.ServiceNet = new Network(null, {id: "11111111-1111-1111-1111-111111111111", label: "private"});
