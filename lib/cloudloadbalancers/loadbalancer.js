/*
 * loadbalancer.js: Instance of a rackspace cloud load balancer
 *
 * (C) 2012 Ken Perkins
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
     * @name LoadBalancer.getUsage
     * @description Gets stats for your load balancer
     * @param {Object|Function}      options     the options for the usage call
     * @param {Function}    callback    handles the callback of your api call
     */
    getUsage: function(options, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/usage',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        if (typeof(options) === 'function') {
            requestOptions.uri += '/current';
            callback = options;
            options = {};
        }

        if (options.startTime) {
            requestOptions.qs = {
                startTime: options.startTime
            };
        }

        if (options.endTime) {
            requestOptions.qs ? requestOptions.qs.endTime = options.endTime :
                requestOptions.qs = {
                    endTime: options.endTime
                };
        }

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.loadBalancerUsageRecords) {
                callback(err);
                return;
            }

            callback(err, body.loadBalancerUsageRecords);
        });
    },

    /**
     * @name LoadBalancer.getSSLConfig
     * @description Get the SSL Termintation configuration for this LB
     * @param {Function}    callback    handles the callback of your api call
     */
    getSSLConfig: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/ssltermination',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            self.sslTermination = body.sslTermination;
            callback(err, body.sslTermination);
        });
    },

    /**
     * @name LoadBalancer.disableSSLTermination
     * @description Disable and remove the connection throttle
     * @param {Function}    callback    handles the callback of your api call
     */
    disableSSLTermination: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/ssltermination',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            delete(self.sslTermination);
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.enableSSLTermination
     * @description Enable the ssl termination for your LB
     * @param {Object}      details     details for the new load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    enableSSLTermination: function(details, callback) {
        var self = this,
            sslConfig = {
                certificate: details.certificate,
                enabled: typeof(details.enabled) === 'boolean' ? details.enabled : true,
                secureTrafficOnly: typeof(details.secureTrafficOnly) === 'boolean' ?
                    details.secureTrafficOnly : false,
                privatekey: details.privatekey,
                securePort: details.securePort
            },
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/ssltermination',
                method: 'PUT',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        if (details.intermediateCertificate) {
            sslConfig.intermediateCertificate = details.intermediateCertificate;
        }

        requestOptions.data = {
            sslTermination: sslConfig
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.connectionThrottle = requestOptions.data.connectionThrottle;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getAccessList
     * @description Gets the access list for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getAccessList: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/accesslist',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.accessList) {
                callback(err);
                return;
            }

            callback(err, body.accessList);
        });
    },

    /**
     * @name LoadBalancer.updateAccessList
     * @description Creates an new access list or appends to the current list
     * @param {Array}       accessList  The list of ips and permissions for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    updateAccessList: function(accessList, callback) {

        _.each(accessList, function(item) {
            if (!item.address || !item.type) {
                throw new Error('Please provide an address and type for each entry');
            }
        });

        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/accesslist',
                method: 'POST',
                data: accessList,
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getAccessList(callback);
        });
    },

    /**
     * @name LoadBalancer.deleteAccessList
     * @description Deletes the entire access list for a load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    deleteAccessList: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/accesslist',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getAccessList(callback);
        });
    },

    /**
     * @name LoadBalancer.deleteAccessListItem
     * @description Deletes a single access list item from a load balancer
     * @param {Array}       accessListItemId  the id of the access list item to delete
     * @param {Function}    callback          handles the callback of your api call
     */
    deleteAccessListItem: function(accessListItemId, callback) {
        this.deleteAccessListItems([ accessListItemId ], callback);
    },

    /**
     * @name LoadBalancer.deleteAccessListItems
     * @description Deletes deletes a set of access list items for a load balancer
     * @param {Array}       accessListItems   the list of access list ids to delete
     * @param {Function}    callback          handles the callback of your api call
     */
    deleteAccessListItems: function(accessListItems, callback) {

        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/accesslist',
                method: 'DELETE',
                qs: {
                    id: accessListItems
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getAccessList(callback);
        });
    },

    /**
     * @name LoadBalancer.getHealthMonitor
     * @description Get the health monitor for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getHealthMonitor: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/healthmonitor',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            callback(err, body.healthMonitor);
        });
    },

    /**
     * @name LoadBalancer.disableHealthMonitor
     * @description Disable and remove the current health monitor for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    disableHealthMonitor: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/healthmonitor',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    },

    /**
     * @name LoadBalancer.enableHealthMonitor
     * @description Enable the health monitor for your load balancer
     * @param {Object}      details     details for the new health monitor
     * @param {Function}    callback    handles the callback of your api call
     */
    // TODO add significantly better input validation
    // http://docs.rackspace.com/loadbalancers/api/v1.0/clb-devguide/content/Monitor_HTTP_and_HTTPS-d1e3635.html
    enableHealthMonitor: function(details, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/healthmonitor',
                method: 'PUT',
                data: {
                    healthMonitor: details
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.getHealthMonitor(callback);
        });
    },

    /**
     * @name LoadBalancer.getConnectionLogConfiguration
     * @description Get the connection Logging configuration
     * @param {Function}    callback    handles the callback of your api call
     */
    getConnectionLogConfiguration: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/connectionlogging',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            self.connectionLogging = body.connectionLogging;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.disableConnectionLogging
     * @description Disable connection logging for this load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    disableConnectionLogging: function(callback) {
        this._setConnectionLogging(false, callback);
    },

    /**
     * @name LoadBalancer.enableConnectionLogging
     * @description Enable connection logging
     * @param {Function}    callback    handles the callback of your api call
     */
    enableConnectionLogging: function(callback) {
        this._setConnectionLogging(true, callback);
    },

    /**
     * @name LoadBalancer._setConnectionLogging
     * @description toggle the connection logging
     * @param {Boolean}     enabled     setting for the connection logging attribute
     * @param {Function}    callback    handles the callback of your api call
     */
    _setConnectionLogging: function(enabled, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/connectionlogging',
                method: 'PUT',
                data: {
                    enabled: enabled
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.connectionLogging = requestOptions.data;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getConnectionThrottlingConfig
     * @description Get the connection throttling configuration
     * @param {Function}    callback    handles the callback of your api call
     */
    getConnectionThrottlingConfig: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/connectionthrottle',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            self.connectionThrottle = body.connectionThrottle;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.disableConnectionThrottling
     * @description Disable and remove the connection throttle
     * @param {Function}    callback    handles the callback of your api call
     */
    disableConnectionThrottling: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/connectionthrottle',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.connectionThrottle = {};
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.enableHealthMonitor
     * @description Enable the health monitor for your load balancer
     * @param {Object}      details     details for the new health monitor
     * @param {Function}    callback    handles the callback of your api call
     */
    // TODO add significantly better input validation
    // http://docs.rackspace.com/loadbalancers/api/v1.0/clb-devguide/content/Throttle_Connections-d1e4057.html
    enableConnectionThrottling: function(details, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/connectionthrottle',
                method: 'PUT',
                data: {
                    connectionThrottle: details
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.connectionThrottle = requestOptions.data.connectionThrottle;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getContentCachingConfig
     * @description Get the content caching configuration
     * @param {Function}    callback    handles the callback of your api call
     */
    getContentCachingConfig: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/contentcaching',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            self.contentCaching = body.contentCaching;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.disableContentCaching
     * @description Disable content caching for this load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    disableContentCaching: function(callback) {
        this._setContentCaching(false, callback);
    },

    /**
     * @name LoadBalancer.enableContentCaching
     * @description Enable content caching
     * @param {Function}    callback    handles the callback of your api call
     */
   enableContentCaching: function(callback) {
        this._setContentCaching(true, callback);
    },

    /**
     * @name LoadBalancer._setContentCaching
     * @description toggle the content caching setting
     * @param {Boolean}     enabled     setting for the content caching attribute
     * @param {Function}    callback    handles the callback of your api call
     */
    _setContentCaching: function(enabled, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/contentcaching',
                method: 'PUT',
                data: {
                    enabled: enabled
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.contentCaching = requestOptions.data;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getSessionPersistence
     * @description Get the session persistence configuration for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getSessionPersistence: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/sessionpersistence',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            self.sessionPersistence = body.sessionPersistence;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.disableSessionPersistence
     * @description Disable session persistence for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    disableSessionPersistence: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/sessionpersistence',
                method: 'DELETE',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            delete(self.sessionPersistence);
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.enableSessionPersistence
     * @description enable session persistence for your health monitor
     * @param {String}      type        details for the new health monitor
     * @param {Function}    callback    handles the callback of your api call
     */
    enableSessionPersistence: function(type, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/sessionpersistence',
                method: 'PUT',
                data: {
                    persistenceType: type
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            self.sessionPersistence = body.sessionPersistence;
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.enableIpVersion6
     * @description Enable IPv6 on Public or ServiceNet for this load balancer
     * @param {rackspace.VirtualIpTypes}    type        the type of network to add
     * @param {Function}                    callback    handles the callback of your api call
     */
    enableIpVersion6: function(type, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/virtualips',
                method: 'POST',
                data: {
                    ipVersion: 'IPV6',
                    type: type
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(body ? body : err);
                return;
            }

            self.getDetails(callback);
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
     * @name LoadBalancer.deleteVirtualIp
     * @description removes a virtual IP from the load balancer
     * @param {rackspace.VirtualIp}     virtualIp   the vip to remove
     * @param {Function}                callback    handles the callback of your api call
     */
    deleteVirtualIp: function(virtualIp, callback) {
        self.deleteVirtualIps([ virtualIp.id ], callback);
    },

    /**
     * @name LoadBalancer.deleteVirtualIps
     * @description removes an array of virtual ip ids from the load balancer
     * @param {Array}       virtualIps      the virtual ips to remove
     * @param {Function}    callback        handles the callback of your api call
     */
    deleteVirtualIps: function(virtualIps, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/virtualips',
                method: 'DELETE',
                qs: {
                    id: virtualIps
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getVirtualIps(callback);
        });
    },

    /**
     * @name LoadBalancer.getNode
     * @description Gets the specified node for your load balancer
     * @param {Number}      nodeId      the nodeId to load information for
     * @param {Function}    callback    handles the callback of your api call
     */
    getNode: function(nodeId, callback) {
        var self = this;

        self.getNodes(function(err) {
            if (err) {
                callback(err);
                return;
            }

            var target;
            _.each(self.nodes, function(node) {
                if (node.id === nodeId) {
                     target = node;
                }
            });

            callback(err, target);
        });
    },

    /**
     * @name LoadBalancer.getNodes
     * @description Gets the nodes for your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getNodes: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/nodes',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.nodes) {
                callback(err);
                return;
            }

            self._populateNodes(body.nodes);
            callback(err, self);
        });
    },

    /**
     * @name LoadBalancer.getNodeServiceEvents
     * @description Gets the service events for the nodes in your load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getNodeServiceEvents: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/nodes/events',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.nodeServiceEvents) {
                callback(err);
                return;
            }

            callback(err, body.nodeServiceEvents);
        });
    },

    /**
     * @name LoadBalancer.addNodes
     * @description adds an array of nodes to the load balancer
     * @param {Array}       nodes       the nodes to add to the array
     * @param {Function}    callback    handles the callback of your api call
     */
    addNodes: function(nodes, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/nodes',
                method: 'POST',
                data: {
                    nodes: nodes
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.nodes) {
                callback(err);
                return;
            }

            self.getNodes(callback);
        });
    },

    /**
     * @name LoadBalancer.deleteNode
     * @description removes a node from the load balancer
     * @param {rackspace.Node}      node        the node to remove
     * @param {Function}            callback    handles the callback of your api call
     */
    deleteNode: function(node, callback) {
        self.deleteNodes( [ node.id ], callback);
    },

    /**
     * @name LoadBalancer.deleteNodes
     * @description removes an array of nodes ids from the load balancer
     * @param {Array}       nodes       the nodes to remove
     * @param {Function}    callback    handles the callback of your api call
     */
    deleteNodes: function(nodes, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/nodes',
                method: 'DELETE',
                qs: {
                    id: nodes
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getNodes(callback);
        });
    },

    /**
     * @name LoadBalancer.updateNode
     * @description updates a node on a load balancer
     * @param {Node}        node        the node to update
     * @param {Function}    callback    handles the callback of your api call
     */
    updateNode: function(node, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + self.id + '/nodes/' + node.id,
                method: 'PUT',
                json: {
                    type: node.type ? node.type : rackspace.Node.PRIMARY,
                    weight: node.weight,
                    condition: node.condition
                },
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getNodes(callback);
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
                callback(err ? err : body);
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

        self._populateNodes(details.nodes);
        self._populateVirtualIps(details.virtualIps);
    },

    /**
     * @name LoadBalancer._populateNodes
     *
     * @description Loads the nodes in this load balancer instance
     *
     * @param {Object}      nodes     the nodes to load
     */
    _populateNodes: function(nodes) {

        if (!nodes) {
            return;
        }

        var self = this;

        self.nodes = [];

        _.each(nodes, function(node) {
            self.nodes.push(new rackspace.Node(self, node));
        });

        self.nodeCount = self.nodes.length;
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
};

exports.Algorithm = {
    LEAST_CONNECTIONS: 'LEAST_CONNECTIONS',
    RANDOM: 'RANDOM',
    ROUND_ROBIN: 'ROUND_ROBIN',
    WEIGHTED_LEAST_CONNECTIONS: 'WEIGHTED_LEAST_CONNECTIONS',
    WEIGHTED_ROUND_ROBIN: 'WEIGHTED_ROUND_ROBIN'
};
