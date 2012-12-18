var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

exports.CloudLoadBalancers = {

    /**
     * @name Client.getLoadBalancers
     *
     * @description get your list of load balancers
     *
     * @param {Function}            callback    handles the callback of your api call
     */
    getLoadBalancers: function(callback) {
        var self = this,
            requestOptions = {
            uri: '/loadbalancers',
            endpoint: rackspace.Endpoints.CloudLoadBalancer
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.loadBalancers) {
                callback(err);
                return;
            }

            var loadBalancers = [];

            for (var i = 0; i < body.loadBalancers.length; i++) {
                loadBalancers.push(new rackspace.LoadBalancer(self, body.loadBalancers[i]));
            }

            callback(err, loadBalancers);
        });
    },

    /**
     * @name Client.getLoadBalancer
     *
     * @description Gets the details for a specific load balancer
     *
     * @param {String}      id          the id of the load balancer
     * @param {Function}    callback    handles the callback of your api call
     */
    getLoadBalancer: function(id, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/' + id,
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.loadBalancer) {
                callback(err);
                return;
            }

            callback(err, new rackspace.LoadBalancer(self, body.loadBalancer));
        });
    },

    /**
     * @name Client.createLoadBalancer
     *
     * @description create a new rackspace cloud load balancer
     *
     * @param {Object}     details     the information for your new load balancer
     * @param {Function}   callback    handles the callback of your api call
     */
    createLoadBalancer: function(details, callback) {
        var self = this;

        // Required arguments
        var lb = {
            name: details.name,
            nodes: details.nodes,
            protocol: details.protocol ? details.protocol.name : '',
            port: details.protocol ? details.protocol.port : '',
            virtualIps: details.virtualIps
        };

        if (details.accessList) {
            lb.accessList = details.accessList;
        }

        if (details.algorithm) {
            lb.algorithm = details.algorithm;
        }

        if (details.connectionLogging) {
            lb.connectionLogging = details.connectionLogging;
        }

        if (details.connectionThrottle) {
            lb.connectionThrottle = details.connectionThrottle;
        }

        if (details.healthMonitor) {
            lb.healthMonitor = details.healthMonitor;
        }

        if (details.metadata) {
            lb.metadata = details.metadata;
        }

        if (details.timeout) {
            lb.timeout = details.timeout;
        }

        if (details.sessionPersistence) {
            lb.sessionPersistence = details.sessionPersistence;
        }

        var validationErrors = validateLbInputs(lb);

        if (validationErrors) {
            callback(validationErrors);
            return;
        }

        var requestOptions = {
            uri: '/loadbalancers',
            method: 'POST',
            data: {
                loadBalancer: lb
            },
            endpoint: rackspace.Endpoints.CloudLoadBalancer
        };

        console.log(require('util').inspect(requestOptions, false, null, true));
        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.loadBalancer) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.LoadBalancer(self, body.loadBalancer));
        });
    },

    /**
     * @name Client.updateLoadBalancer
     * @description update a load balancer
     * @param {LoadBalancer}    loadBalancer    the loadBalancer to update
     * @param {Function}        callback        handles the callback of your api call
     */
    updateLoadBalancer: function(loadBalancer, callback) {

        if (typeof(loadBalancer) !== 'object') {
            throw new Error('Load Balancer is required');
        }

        var requestOptions = {
            uri: '/loadbalancers/' + loadBalancer.id,
            method: 'PUT',
            data: {
                name: loadBalancer.name,
                algorithm: loadBalancer.algorithm,
                protocol: loadBalancer.protocol,
                port: loadBalancer.port,
                timeout: loadBalancer.timeout
            },
            endpoint: rackspace.Endpoints.CloudLoadBalancer
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, loadBalancer);
        });
    },

    /**
     * @name Client.deleteLoadBalancer
     * @description delete a load balancer
     * @param {LoadBalancer}        loadBalancer        the load balancer to delete
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteLoadBalancer: function(loadBalancer, callback) {
        this.deleteLoadBalancers([ loadBalancer ], callback);
    },

    /**
     * @name Client.deleteLoadBalancers
     * @description delete an array of load balancers
     * @param {Array}               loadBalancers       the array of load balancers to delete
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteLoadBalancers: function(loadBalancers, callback) {
        var self = this;

        var lbIds = [];

        _.each(loadBalancers, function(loadBalancer) {
            lbIds.push(loadBalancer.id);
        });

        var requestOptions = {
            uri: '/loadbalancers',
            method: 'DELETE',
            qs: {
                id: lbIds
            },
            endpoint: rackspace.Endpoints.CloudLoadBalancer
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err, res.statusCode === 202);
        });
    },

    /**
     * @name Client.getAllowedDomains
     * @description Gets the list of allowed domains for your load balancers
     * @param {Function}    callback    handles the callback of your api call
     */
    getAllowedDomains: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/alloweddomains',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.allowedDomains) {
                callback(err);
                return;
            }

            callback(err, body.allowedDomains);
        });
    },

    /**
     * @name Client.getBillableUsage
     * @description Gets the billing report for your load balancers
     * @param {Object|Function}      options     the options for the usage call
     * @param {Function}    callback    handles the callback of your api call
     */
    getBillableUsage: function(options, callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/billable',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        if (typeof(options) === 'function') {
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

        if (options.offset) {
            requestOptions.qs ? requestOptions.qs.offset = options.offset :
                requestOptions.qs = {
                    offset: options.offset
                };
        }

        if (options.limit) {
            requestOptions.qs ? requestOptions.qs.limit = options.limit :
                requestOptions.qs = {
                    limit: options.limit
                };
        }

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err);
                return;
            }

            callback(err, body);
        });
    },

    /**
     * @name Client.getProtocols
     * @description Gets the available protocols for load balancing
     * @param {Function}    callback    handles the callback of your api call
     */
    getProtocols: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/protocols',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.protocols) {
                callback(err);
                return;
            }

            callback(err, body.protocols);
        });
    },

    /**
     * @name Client.getAlgorithms
     * @description Gets the available algorithms for load balancing
     * @param {Function}    callback    handles the callback of your api call
     */
    getAlgorithms: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/loadbalancers/algorithms',
                endpoint: rackspace.Endpoints.CloudLoadBalancer
            };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.algorithms) {
                callback(err);
                return;
            }

            callback(err, body.algorithms);
        });
    }
};

validateLbInputs = function(inputs) {

    var errors = {
        requiredParametersMissing: [],
        invalidInputs: []
        }, response;

    if (!inputs.name) {
        errors.requiredParametersMissing.push('name');
    }

    if (!inputs.nodes) {
        errors.requiredParametersMissing.push('nodes');
    }

    if (!inputs.protocol) {
        errors.requiredParametersMissing.push('protocol');
    }

    if (!inputs.port) {
        errors.requiredParametersMissing.push('port');
    }

    if (!inputs.virtualIps) {
        errors.requiredParametersMissing.push('virtualIps');
    }

    if (inputs.name && inputs.name.length > 128) {
        errors.invalidInputs.push('name exceeds maximum 128 length');
    }

    if (typeof(inputs.nodes) !== 'object') {
        errors.invalidInputs.push('nodes must be an array');
    }

    if (inputs.nodes && inputs.nodes.length <= 0) {
        errors.invalidInputs.push('nodes requires at least one node');
    }

    if (!inputs.protocol ||
        typeof(inputs.protocol) !== 'string' ||
        !rackspace.Protocols[inputs.protocol]) {
        errors.invalidInputs.push('please specify a valid protocol');
    }

    // TODO Node validation

    if (errors.requiredParametersMissing.length) {
        response ? response.requiredParametersMissing = errors.requiredParametersMissing :
            response = {
                requiredParametersMissing: errors.requiredParametersMissing
            };
    }

    if (errors.invalidInputs.length) {
        response ? response.invalidInputs = errors.invalidInputs :
            response = {
                invalidInputs: errors.invalidInputs
            };
    }

    return response;
};