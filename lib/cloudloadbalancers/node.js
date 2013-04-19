/*
 * node.js: Instance of a rackspace cloud load balancer node
 *
 * (C) 2012 Ken Perkins
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
        throw new Error('Node must be constructed with at-least basic details.')
    }

    this.loadbalancer = loadbalancer;
    this._setProperties(details);
};

Node.prototype = {

    /**
     * @name Node.update
     *
     * @description updates the node on the load balancer
     *
     * @param {Function}      callback
     */
    update: function(callback) {
        var self = this;

        this.loadbalancer.updateNode(self, function(err, nodes) {
            if (err) {
                callback(err);
                return;
            }

            nodes.forEach(function(node) {
                if (node.id == self.id) {
                    self = node;
                }
            });

            callback(err);
        });
    },

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

exports.NodeConditions = {
    ENABLED: 'ENABLED',
    DISABLED: 'DISABLED',
    DRAINING: 'DRAINING'
};

exports.NodeType = {
    PRIMARY: 'PRIMARY',
    SECONDARY: 'SECONDARY'
};
