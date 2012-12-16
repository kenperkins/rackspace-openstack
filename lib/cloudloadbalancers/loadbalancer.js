/*
 * loadbalancer.js: Instance of a rackspace cloud load balancer
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
 *
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

var LoadBalancer = function(client, details) {
    if (!details) {
        throw new Error('LoadBalancer must be constructed with at-least basic details.')
    }

    this.client = client;
    this._setProperties(details);
};

LoadBalancer.prototype = {

    /**
     * @name LoadBalancer.getDetails
     * @description Update the  details for this load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        self.client.getLoadBalancer(this.id, function(err, loadBalancer) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(loadBalancer);
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        var self = this;

        this.id = details.id;
        this.name = details.name;
        this.port = details.port;
        this.protocol = details.protocol;
        this.nodeCount = details.nodeCount;
        this.algorithm = details.algorithm;
        this.status = details.status;
        this.timeout = details.timeout;
        this.cluster = details.cluster;
        this.created = details.created;
        this.updated = details.updated;
        this.connectionLogging = details.connectionLogging;
        this.sourceAddresses = details.sourceAddresses;
        this.connectionThrottle = details.connectionThrottle;
        this.sessionPersistence = details.sessionPersistence;

        if (details.nodes) {
            this.nodes = [];

            _.each(details.nodes, function(node) {
                self.nodes.push(new rackspace.Node(self, node));
            });

            this.nodeCount = this.nodes.length;
        }

        if (details.virtualIps) {
            this.virtualIps = [];

            _.each(details.virtualIps, function(virtualIp) {
                self.virtualIps.push(new rackspace.VirtualIp(virtualIp));
            });
        }
    }
};

exports.LoadBalancer = LoadBalancer;

exports.SessionPersistence = {
    HTTP_COOKIE: 'HTTP_COOKIE',
    SOURCE_IP: 'SOURCE_IP'
}
