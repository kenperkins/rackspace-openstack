/*
 * core.js: Core functions for accessing rackspace openstack servers
 *
 * (C) 2012 Clipboard, Inc.
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var request = require('request'),
    openstack = require('../openstack'),
    _ = require('underscore');//,
    //utils = require('./utils');

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

    this.authorized = false;
};

/**
 * @name Client.authorize
 * @description authorize talks to the rackspace API, and upon validation,
 * populates your client with auth tokens and service endpoints
 * @param {Function} callback handles the callback for validating your Auth
 */
Client.prototype.authorize = function(callback) {
    var self = this;
    var authRequestOptions = {
        uri: this.config.authUrl + '/tokens',
        json: {
            auth: {
                'RAX-KSKEY:apiKeyCredentials':{
                    'username': this.config.auth.username,
                    'apiKey'  : this.config.auth.apiKey
                }
            }
        }
    };

    request(authRequestOptions, function(err, res, body) {
        if (err) {
            callback(err);
            return;
        }
        else if (body && body.unauthorized) {
            callback(body.unauthorized);
            return;
        }

        self.authorized = true;

        self.config.token = body.access.token;
        self.config.serviceCatalog = body.access.serviceCatalog;
        self.config.defaultRegion = body.access.user['RAX-AUTH:defaultRegion'];

        callback(err, self.config);
    });
};

/**
 * @name Client.authorizedRequest
 * @description Global handler for creating a new authorized request to the
 * Rackspace API endpoint
 * @param {Object} options provides required values for the request
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.authorizedRequest = function(options, callback) {
    var self = this;

    if (!options || !callback) {
        throw new Error('Options and Callback are required');
    }

    var endpoint = getEndpoint({
        type: 'compute',
        name: 'cloudServersOpenStack',
        region: self.config.defaultRegion
    }, self.config.serviceCatalog);

    var requestOptions = {
        uri: endpoint + options.uri,
        method: options.method || 'GET',
        json: options.data ? options.data : true,
        headers: {
            'X-AUTH-TOKEN': self.config.token.id
        }
    };

    request(requestOptions, callback);
};

/**
 * @name getServers
 * @description getServers retrieves your list of servers
 * @param {Object|Function} details provides filters on your servers request NOT USED
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getServers = function(details, callback) {
    var self = this;

    if (typeof(details) === 'function') {
        callback = details;
        details = {};
    }

    var requestOptions = {
        uri: '/servers/detail'
    };

    requestOptions.qs = _.pick(details,
        'image',
        'flavor',
        'name',
        'status',
        'marker',
        'limit',
        'changes-since');

    self.authorizedRequest(requestOptions, function(err, res, body) {

        if (err || !body.servers) {
            callback(err);
            return;
        }

        var servers = [];

        for (var i = 0; i < body.servers.length; i++) {
            servers.push(new openstack.Server(self, body.servers[i]));
        }

        callback(err, servers);
    });
};

/**
 * @name Client.getServer
 * @description getServer retrieves the specified server
 * @param {String} id of the server to get
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getServer = function(id, callback) {
    var self = this;

    var requestOptions = {
        uri: '/servers/' + id
    };

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.server) {
            callback(err);
            return;
        }

        callback(err, new openstack.Server(self, body.server));
    });
};

/**
 * @name Client.createServer
 * @description Creates a server with the specified options. The flavor / image
 * properties of the options can be instances of rackspace-openstack's objects
 * (Flavor, Image) OR ids to those entities in Rackspace.
 * @param {Object} options the server options to use in building your server
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.createServer = function(options, callback) {
    var self = this, flavorId, imageId;

    ['flavor', 'image', 'name'].forEach(function(required) {
        if (!options[required]) throw new Error('options.' +
            required + ' is a required argument.');
    });

    flavorId = options['flavor'] instanceof openstack.Flavor ?
        options['flavor'].id : parseInt(options['flavor'], 10);

    imageId = options['image'] instanceof openstack.Image ?
        options['image'].id : options['image'];

    var requestOptions = {
        uri: '/servers',
        method: 'POST',
        data: {
            server: {
                name: options['name'],
                imageRef: imageId,
                flavorRef: flavorId,
                metadata: options['metadata'],
                personality: options['personality'] || []
            }
        }
    };

    // Don't set the adminPass on the request unless we've got one
    if (options.adminPass) {
        requestOptions.data.server.adminPass = options.adminPass;
    }

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.server) {
            callback(err);
            return;
        }

        callback(err, new openstack.Server(self, _.extend({}, body.server, options)));
    });
};

/**
 * @name Client.destroyServer
 * @description deletes the specified server
 * @param {Object|String} server or server id to delete
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.destroyServer = function(server, callback) {
    var self = this, serverId;

    serverId = server instanceof openstack.Server ? server.id : server;

    if (!server) {
        throw new Error('Server is a required argument.');
    }

    var requestOptions = {
        uri: '/servers/' + serverId,
        method: 'DELETE'
    };

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err) {
            callback(err);
            return;
        }

        callback(err, res.statusCode === 204);
    });
};

/**
 * @name Client.getFlavors
 * @description getFlavors retrieves your list of image flavors
 * @param {Object|Function} details provides filters on your flavors request NOT USED
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getFlavors = function(details, callback) {
    var self = this;

    if (typeof(details) === 'function') {
        callback = details;
        details = {};
    }

    var requestOptions = {
        uri: '/flavors/detail'
    };

    requestOptions.qs = _.pick(details,
        'minDisk',
        'minRam',
        'marker',
        'limit');

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.flavors) {
            callback(err);
            return;
        }

        var flavors = [];

        for (var i = 0; i < body.flavors.length; i++) {
            flavors.push(new openstack.Flavor(self, body.flavors[i]));
        }

        callback(err, flavors);
    });
};

/**
 * @name Client.getFlavor
 * @description getFlavor retrieves the specified flavor
 * @param {String} id of the flavor to get
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getFlavor = function(id, callback) {
    var self = this;

    var requestOptions = {
        uri: '/flavors/' + id
    };

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.flavor) {
            callback(err);
            return;
        }

        callback(err, new openstack.Flavor(self, body.flavor));
    });
};


/**
 * @name Client.getImages
 * @description getImages retrieves your list of server images
 * @param {Object|Function} details provides filters on your server images request NOT USED
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getImages = function(details, callback) {
    var self = this;

    if (typeof(details) === 'function') {
        callback = details;
        details = {};
    }

    var requestOptions = {
        uri: '/images/detail'
    };

    requestOptions.qs = _.pick(details,
        'server',
        'name',
        'status',
        'marker',
        'limit',
        'changes-since',
        'type');

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.images) {
            callback(err);
            return;
        }

        var images = [];

        for (var i = 0; i < body.images.length; i++) {
            images.push(new openstack.Image(self, body.images[i]));
        }

        callback(err, images);
    });
};

/**
 * @name Client.getImage
 * @description Gets the details for a specified image id
 *
 * @param {String} id the image id of the requested image
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.getImage = function(id, callback) {
    var self = this;

    var requestOptions = {
        uri: '/images/' + id
    };

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || !body.image) {
            callback(err);
            return;
        }

        callback(err, new openstack.Image(self, body.image));
    });
};

/**
 * @name Client.createServerImage
 * @description This operation creates a new image for a specified server.
 * Once complete, a new image is available that you can use to rebuild or
 * create servers.
 *
 * @param {Object} options handles the callback of your api call
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.createServerImage = function(options, callback) {
    var self = this;

    ['name', 'server'].forEach(function(required) {
        if (!options[required]) throw new Error('options.' +
            required + ' is a required argument.');
    });

    var serverId = options.server instanceof openstack.Server ?
            options.server.id : options.server;

    var createImageData = {
        name: options.name
    };

    if (options.metadata) {
        createImageData.metadata = options.metadata;
    }

    var requestOptions = {
        uri: '/servers/' + serverId + '/action',
        method: 'POST',
        data: {
            createImage: createImageData
        }
    };

    self.authorizedRequest(requestOptions, function(err, res, body) {
        if (err || res.statusCode !== 202) {
            callback(err);
            return;
        }

        // HACK
        // Rackspace returns a URL to a non-existant End point, so instead
        // we strip the guid off the end of the request and return it as the
        // image Id
        var re = new RegExp("images/([abcdef0-9]{8}-[abcdef0-9]{4}-[abcedf0-9]{4}-[abcdef0-9]{4}-[abcdef0-9]{12})$");
        callback(err, res.headers['location'].match(re)[1]);
    });
};

/**
 * @name Client.destroyImage
 * @description This operation deletes the specified image from the system.
 *
 * @param {Object} image the image object or id to delete
 * @param {Function} callback handles the callback of your api call
 */
Client.prototype.destroyImage = function(image, callback) {
    var self = this,
        imageId = image instanceof openstack.Image ? image.id : image;

    var destroyOptions = {
        method: 'DELETE',
        uri: '/images/' + imageId
    };

    self.authorizedRequest(destroyOptions, function(err, res, body) {
        if (err || res.statusCode !== 204) {
            callback(err);
            return;
        }

        callback(err, true);
    });
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