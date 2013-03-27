/*
 * client.js: Core functions for accessing the Rackspace API
 *
 * (C) 2012 Ken Perkins
 * Inspired by node-cloudservers from Nodejitsu
 *
 * MIT LICENSE
 *
 */

var request = require('request'),
    rackspace = require('../rackspace-openstack'),
    CloudDns = require('./clouddns').CloudDns,
    CloudLoadBalancers = require('./cloudloadbalancers').CloudLoadBalancers,
    CloudServers = require('./cloudservers').CloudServers,
    CloudBlockStorage = require('./cloudblockstorage').CloudBlockStorage,
    CloudDatabases = require('./clouddatabases').CloudDatabases,
    _ = require('underscore'),
    winston = require('winston');

var usAuthUrl = 'https://identity.api.rackspacecloud.com/v2.0',
    ukAuthUrl = 'https://lon.identity.api.rackspacecloud.com/v2.0';

exports.createClient = function(options) {
    return new Client(options);
};

var Client = exports.Client = function(options) {
    if (!options || !options.auth) throw new Error('options.auth is required to create Config');

    this.config = {};

    this.config.auth = options.auth;

    if (options.location && options.location === 'UK') {
        this.config.authUrl = ukAuthUrl;
    }
    else {
        this.config.authUrl = usAuthUrl;
    }

    this.logLevel = options.logLevel || 'error';
    this.log = options.log || this._getLogger();
    this.authorized = false;
};

/**
 * @name Client.authorize
 *
 * @description authorize talks to the rackspace API, and upon validation,
 * populates your client with auth tokens and service endpoints
 *
 * @param {Function}    callback    handles the callback for validating your Auth
 */
var core = {
    _getLogger: function() {
        var self = this;

        var myCustomLevels = {
            levels: {
                debug: 0,
                verbose: 1,
                info: 2,
                warn: 3,
                error: 4
            },
            colors: {
                debug: 'blue',
                verbose: 'cyan',
                info: 'green',
                warn: 'yellow',
                error: 'red'
            }
        };

        var transports = [];
        transports.push(new winston.transports.Console({
            levelDecorators: ['[', ']'],
            level: self.config.logLevel,
            colorize: true,
            timestamp: false,
            debugToStdOut: true
        }));

        var logger = new winston.Logger({
            levels: myCustomLevels.levels,
            transports: transports
        });

        winston.addColors(myCustomLevels.colors);

        return logger;
    },

    authorize: function(callback) {
        var self = this;
        var authRequestOptions = {
            uri: this.config.authUrl + '/tokens',
            json: {
                auth: {
                    'RAX-KSKEY:apiKeyCredentials': {
                        'username': this.config.auth.username,
                        'apiKey': this.config.auth.apiKey
                    }
                }
            }
        };

        request(authRequestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body );
                return;
            }

            self.authorized = true;

            self.config.token = body.access.token;
            self.config.serviceCatalog = body.access.serviceCatalog;
            self.config.defaultRegion = body.access.user['RAX-AUTH:defaultRegion'];

            callback(err, self.config);
        });
    },

    /**
     * @name Client.authorizedRequest
     *
     * @description Global handler for creating a new authorized request to the
     * Rackspace API endpoint. Defaults to the cloudServersOpenStack endpoint, but
     * be overridden.
     *
     * @param {Object}      options     provides required values for the request
     * @param {Function}    callback    handles the callback of your api call
     */
    authorizedRequest: function(options, callback) {
        var self = this;

        if (!options || !callback) {
            throw new Error('Options and Callback are required');
        }

        var defaultEndpoint = options.endpoint ? options.endpoint :
            rackspace.Endpoints.Openstack;

        var endpoint = getEndpoint(_.extend({}, defaultEndpoint, {
            region: self.config.defaultRegion
        }), self.config.serviceCatalog);

        var requestOptions = {
            uri: endpoint + options.uri,
            method: options.method || 'GET',
            json: options.data ? options.data : true,
            headers: {
                'X-AUTH-TOKEN': self.config.token.id
            }
        };

        if (options.qs) {
            requestOptions.qs = options.qs;
        }

        request(requestOptions, callback);
    }
};

function getEndpoint(options, catalog) {

    ['type', 'name', 'region'].forEach(function(required) {
        if (!options[required]) throw new Error('options.' +
            required + ' is a required argument.');
    });

    if (!catalog) {
        throw new Error('Catalog is a required argument.');
    }

    var endpointUrl = '';

    for (var i = 0; i < catalog.length; i++) {
        var service = catalog[i];

        if (service.type === options.type && service.name === options.name) {
            if (service.endpoints.length === 1) {
                endpointUrl = service.endpoints[0].publicURL;
                break;
            }

            for (var j = 0; j < service.endpoints.length; j++) {

                var endpoint = service.endpoints[j];

                if (endpoint.region === options.region) {
                    endpointUrl = endpoint.publicURL;
                    break;
                }
            }
        }
    }

    return endpointUrl;
}

// We break our different modules into different files, then we extend the
// prototype of the client based on the merged functions

var prototype = _.extend({},
    core,
    CloudDns,
    CloudLoadBalancers,
    CloudServers,
    CloudBlockStorage,
    CloudDatabases);

_.each(prototype, function(value, key) {
    Client.prototype[key] = value;
});
