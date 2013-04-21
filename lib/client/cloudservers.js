var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

/**
 * @name getServers
 *
 * @description getServers retrieves your list of servers
 *
 * @param {Object|Function} details provides filters on your servers request
 * @param {Function}    callback    handles the callback of your api call
 */
exports.CloudServers = {
    getServers: function(details, callback) {
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
                servers.push(new rackspace.Server(self, body.servers[i]));
            }

            callback(err, servers);
        });
    },

    /**
     * @name Client.getServer
     *
     * @description getServer retrieves the specified server
     *
     * @param {String}      id          of the server to get
     * @param {Function}    callback    handles the callback of your api call
     */
    getServer: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/servers/' + id
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.server) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Server(self, body.server));
        });
    },

    /**
     * @name Client.createServer
     *
     * @description Creates a server with the specified options. The flavor / image
     * properties of the options can be instances of rackspace-openstack's objects
     * (Flavor, Image) OR ids to those entities in Rackspace.
     *
     * @param {Object}      options     the server options to use in building your server
     * @param {Function}    callback    handles the callback of your api call
     */
    createServer: function(options, callback) {
        var self = this, flavorId, imageId;

        ['flavor', 'image', 'name'].forEach(function(required) {
            if (!options[required]) throw new Error('options.' +
                required + ' is a required argument.');
        });

        flavorId = options['flavor'] instanceof rackspace.Flavor ?
            options['flavor'].id : parseInt(options['flavor'], 10);

        imageId = options['image'] instanceof rackspace.Image ?
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

        // Only specify networks if the user specified them
        if (options.networks) {
            requestOptions.data.server.networks = _.map(options.networks, function(network) {
                return { uuid: network instanceof rackspace.Network ? network.id : network }
            });
        }

        // Don't set the adminPass on the request unless we've got one
        if (options.adminPass) {
            requestOptions.data.server.adminPass = options.adminPass;
        }

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.server) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.Server(self, _.extend({}, body.server, options)));
        });
    },

    /**
     * @name Client.createServerWithWait
     *
     * @description Creates a server and waits for the server to be in Active Status
     *
     * @param {Object}              details     the server details to use in building your server
     * @param {Object|Function}     options     optional parameters used for server creation
     * @param {Function}            callback    handles the callback of your api call
     */
    createServerWithWait: function(details, options, callback) {
        var self = this;

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        self.createServer(details, function(err, server)  {
            if (err) {
                callback(err);
                return;
            }

            var waitOptions = {
                interval: 5000,
                maxWait: options.maxWait ? options.maxWait : 30 * 60, // 30 minute default,
                update: options.update,
                finish: options.finish
            };

            server.setWait({ status: 'ACTIVE' }, waitOptions, function(err, server) {
                callback(err, server);
            });
        });
    },

    /**
     * @name Client.destroyServer
     *
     * @description deletes the specified server
     *
     * @param {Object|String}   server      server or server id to delete
     * @param {Function}        callback    handles the callback of your api call
     */
    destroyServer: function(server, callback) {
        var self = this, serverId;

        serverId = server instanceof rackspace.Server ? server.id : server;

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
    },

    /**
     * @name Client.getFlavors
     *
     * @description getFlavors retrieves your list of flavors
     *
     * @param {Object|Function}     details     provides filters on your flavors request
     * @param {Function}            callback    handles the callback of your api call
     */
    getFlavors: function(details, callback) {
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
                flavors.push(new rackspace.Flavor(self, body.flavors[i]));
            }

            callback(err, flavors);
        });
    },

    /**
     * @name Client.getFlavor
     *
     * @description getFlavor retrieves the specified flavor
     *
     * @param {String}      id          id of the flavor to get
     * @param {Function}    callback    handles the callback of your api call
     */
    getFlavor: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/flavors/' + id
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.flavor) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Flavor(self, body.flavor));
        });
    },

    /**
     * @name Client.getImages
     *
     * @description getImages retrieves your list of server images
     *
     * @param {Object|Function}     details     provides filters on your server images request
     * @param {Function}            callback    handles the callback of your api call
     */
    getImages: function(details, callback) {
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
                images.push(new rackspace.Image(self, body.images[i]));
            }

            callback(err, images);
        });
    },

    /**
     * @name Client.getImage
     *
     * @description Gets the details for a specified image id
     *
     * @param {String}      id          the image id of the requested image
     * @param {Function}    callback    handles the callback of your api call
     */
    getImage: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/images/' + id
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.image) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Image(self, body.image));
        });
    },

    /**
     * @name Client._constructNetwork
     *
     * @description This ensures that all Network instances that
     * represent ServiceNet and PublicNet are the same instance.
     */
    _constructNetwork: function(self, details) {
        switch (details.id) {
            case '00000000-0000-0000-0000-000000000000':
                return rackspace.PublicNet;
            case '11111111-1111-1111-1111-111111111111':
                return rackspace.ServiceNet;
            default:
                return new rackspace.Network(self, details);
        }
    },

    /**
     * @name Client.getNetworks
     *
     * @description getNetworks retrieves your list of cloud networks
     *
     * @param {Function}            callback    handles the callback of your api call
     */
    getNetworks: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/os-networksv2'
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.networks) {
                callback(err);
                return;
            }

            var networks = [];

            for (var i = 0; i < body.networks.length; i++) {
                networks.push(self._constructNetwork(self, body.networks[i]));
            }

            callback(err, networks);
        });
    },

    /**
     * @name Client.getNetwork
     *
     * @description Gets the details for a specified cloud network id
     *
     * @param {String}      id          the network id of the requested cloud network
     * @param {Function}    callback    handles the callback of your api call
     */
    getNetwork: function(id, callback) {
        var self = this;

        // We can't get details on the two default networks
        if (_.include([rackspace.PublicNet.id, rackspace.ServiceNet.id], id)) {
            callback(null, this);
            return;
        }

        var requestOptions = {
            uri: '/os-networksv2/' + id
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.network) {
                callback(err);
                return;
            }

            callback(err, self._constructNetwork(self, body.network));
        });
    },

    /**
     * @name Client.createNetwork
     *
     * @description creates a new cloud network
     *
     * @param {Object}          options     details about the new network
     * @param {Function}        callback    handles the callback of your api call
     */
    createNetwork: function(options, callback) {
        var self = this;

        ['cidr', 'label'].forEach(function(required) {
            if (!options[required]) throw new Error('options.' +
                required + ' is a required argument.');
        });

        var createNetworkData = options;

        var requestOptions = {
            uri: '/os-networksv2',
            method: 'POST',
            data: {
                network: createNetworkData
            }
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200 || !body.network) {
                callback(err || body);
                return;
            }

            callback(err, new rackspace.Network(self, body.network));
        });
    },

    /**
     * @name Client.destroyNetowrk
     *
     * @description deletes the specified cloud network
     *
     * @param {Object|String}   network     network or network id to delete
     * @param {Function}        callback    handles the callback of your api call
     */
    destroyNetwork: function(network, callback) {
        var self = this, networkId;

        if (!network) {
            throw new Error('Network is a required argument.');
        }

        networkId = network instanceof rackspace.Network ? network.id : network;

        // We can't delete the predefined networks
        if (_.include([rackspace.PublicNet.id, rackspace.ServiceNet.id], networkId)) {
            throw new Error('Cannot delete predefined network.');
        }

        var requestOptions = {
            uri: '/os-networksv2/' + networkId,
            method: 'DELETE'
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            callback(err || (res.statusCode !== 202 && body.replace(/\n+/g, ' ')), network);
        });
    },

    /**
     * @name Client.createServerImage
     *
     * @description This operation creates a new image for a specified server.
     * Once complete, a new image is available that you can use to rebuild or
     * create servers.
     *
     * @param {Object}      options     attributes of the new server to create
     * @param {Function}    callback    handles the callback of your api call
     */
    createServerImage: function(options, callback) {
        var self = this;

        ['name', 'server'].forEach(function(required) {
            if (!options[required]) throw new Error('options.' +
                required + ' is a required argument.');
        });

        var serverId = options.server instanceof rackspace.Server ?
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

            // TODO HACK
            // Rackspace returns a URL to a non-existant End point, so instead
            // we strip the guid off the end of the request and return it as the
            // image Id
            var re = new RegExp("images/([abcdef0-9]{8}-[abcdef0-9]{4}-[abcedf0-9]{4}-[abcdef0-9]{4}-[abcdef0-9]{12})$");
            callback(err, res.headers['location'].match(re)[1]);
        });
    },

    /**
     * @name Client.destroyImage
     *
     * @description This operation deletes the specified image from the system.
     *
     * @param {Object}      image       the image object or id to delete
     * @param {Function}    callback    handles the callback of your api call
     */
    destroyImage: function(image, callback) {
        var self = this,
            imageId = image instanceof rackspace.Image ? image.id : image;

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
    }
};
