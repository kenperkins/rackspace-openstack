var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

exports.CloudDatabases = {

    /**
     * @name Client.createDatabaseInstance
     *
     * @description Creates a Cloud Databases instance
     *
     * @param {Object}      options     the options to use in building your database instance
     * @param {Function}    callback    handles the callback of your api call
     */
    createDatabaseInstance: function(options, callback) {
        var self = this;

        ['flavor', 'size'].forEach(function(required) {
            if (!options[required]) throw new Error('options.' +
                required + ' is a required argument.');
        });

        var requestOptions = {
            uri: '/instances',
            method: 'POST',
            data: {
                instance: {
                    flavorRef: options.flavor,
                    volume: {size: options.size},
                }
            },
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        ['name', 'databases', 'users'].forEach(function(optional) {
            requestOptions.data.instance[optional] = options[optional];
        });

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.instance) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.DatabaseInstance(self, _.extend({}, body.instance, options)));
        });
    },

    /**
     * @name Client.createDatabaseInstanceWithWait
     *
     * @description Creates a database instance and waits for it to be in Active Status
     *
     * @param {Object}              details     the instance details to use in building your instance
     * @param {Object|Function}     options     optional parameters used for instance creation
     * @param {Function}            callback    handles the callback of your api call
     */
    createDatabaseInstanceWithWait: function(details, options, callback) {
        var self = this;

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        self.createDatabaseInstance(details, function(err, instance)  {
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

            instance.setWait({ status: 'ACTIVE' }, waitOptions, function(err, instance) {
                callback(err, instance);
            });
        });
    },

    /**
     * @name Client.destroyDatabaseInstance
     *
     * @description deletes the specified instance
     *
     * @param {Object|String}   instance      instance or instance id to delete
     * @param {Function}        callback    handles the callback of your api call
     */
    destroyDatabaseInstance: function(instance, callback) {
        var self = this, instanceId;

        instanceId = instance instanceof rackspace.DatabaseInstance ? instance.id : instance;

        if (!instance) {
            throw new Error('DatabaseInstance is a required argument.');
        }

        var requestOptions = {
            uri: '/instances/' + instanceId,
            method: 'DELETE',
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err);
                return;
            }

            callback(err, res.statusCode === 202);
        });
    },

    /**
     * @name Client.getDatabaseInstances
     *
     * @description getDatabaseInstances retrieves your list of database instances
     *
     * @param {Function}            callback    handles the callback of your api call
     */
    getDatabaseInstances: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances',
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.instances) {
                callback(err ? err : body);
                return;
            }

            var instances = [];

            for (var i = 0; i < body.instances.length; i++) {
                instances.push(new rackspace.DatabaseInstance(self, body.instances[i]));
            }

            callback(err, instances);
        });
    },

    /**
     * @name Client.getDatabaseInstance
     *
     * @description Gets the details for a specified database instance id
     *
     * @param {String}      id          the id of the requested database instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDatabaseInstance: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances/' + id,
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.instance) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.DatabaseInstance(self, body.instance));
        });
    }
};
