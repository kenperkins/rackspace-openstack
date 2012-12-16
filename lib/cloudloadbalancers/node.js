/*
 * node.js: Instance of a rackspace cloud load balancer node
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
 *
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack');

var Node = function(loadbalancer, details) {
    if (!details) {
        throw new Error('VirtualIp must be constructed with at-least basic details.')
    }

    this.loadbalancer = loadbalancer;
    this._setProperties(details);
};

Node.prototype = {

    /**
     * @name Node._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.address = details.address;
        this.port = details.port;
        this.condition = details.condition;
        this.status = details.status;
        this.weight = details.weight;
        this.type = details.type;
    }
};

exports.Node = Node;
