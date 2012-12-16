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
     * @name LoadBalancer.getStats
     * @description Gets stats for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getStats: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/stats',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body) {
                callback(err);
                return;
            }

            callback(err, body);
        });
    },

    /**
     * @name LoadBalancer.getVirtualIps
     * @description Gets the virtual ips for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getVirtualIps: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/virtualips',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.virtualIps) {
                callback(err);
                return;
            }

            self._populateVirtualIps(body.virtualIps);
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getErrorPage
     * @description Gets the current Error Page for the load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getErrorPage: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/errorpage',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.errorpage) {
                callback(err);
                return;
            }

            callback(err, body.errorpage);
        });
    },

    /**
     * @name LoadBalancer.setErrorPage
     * @description Deletes the error page for a load balancer instance
     * @param {String}      content     the content of your new error page
     * @param {Function}    callback    handles the callback of your api call
     */
    setErrorPage: function(content, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/errorpage',
                method: 'PUT',
                data: {
                    errorpage: {
                        content: content
                    }
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.errorpage) {
                callback(err);
                return;
            }

            callback(err, body.errorpage);
        });
    },

    /**
     * @name LoadBalancer.deleteErrorPage
     * @description Deletes the error page for a load balancer instance
     * @param {Function}    callback    handles the callback of your api call
     */
    deleteErrorPage: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/errorpage',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, true);
        });
    },

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

        self._populateVirtualIps(details.virtualIps);
    },

    /**
     * @name LoadBalancer._populateVirtualIps
     *
     * @description Loads the virtualIps into this load balancer instance
     *
     * @param {Object}      virtualIps     the virtualIps to load
     */
    _populateVirtualIps: function(virtualIps) {

        if (!virtualIps) {
            return;
        }

        var self = this;

        self.virtualIps = [];

        _.each(virtualIps, function(virtualIp) {
            self.virtualIps.push(new rackspace.VirtualIp(virtualIp));
        });
    }
};

exports.LoadBalancer = LoadBalancer;

exports.SessionPersistence = {
    HTTP_COOKIE: 'HTTP_COOKIE',
    SOURCE_IP: 'SOURCE_IP'
}
