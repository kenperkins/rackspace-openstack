/*
 * instance.js: Instance of a rackspace cloud databases server
 *
 * (C) 2013 Andrew Regner
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

var DatabaseInstance = function(client, details) {
    if (!details) {
        throw new Error("DatabaseInstance must be constructed with at-least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

DatabaseInstance.prototype = {
    /**
     * @name DatabaseInstance.getDatabases
     *
     * @description returns all the databases on this database instance
     *
     * @param {Function}   callback    handles the callback of your api call
     */
    getDatabases: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances/' + this.id + '/databases',
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.databases) {
                callback(err ? err : body);
                return;
            }

            var databases = [];

            for (var i = 0; i < body.databases.length; i++) {
                databases.push(new rackspace.Database(self, body.databases[i]));
            }

            callback(err, databases);
        });
    },

    /**
     * @name DatabaseInstance.getUsers
     *
     * @description returns all the users on this database instance
     *
     * @param {Function}   callback    handles the callback of your api call
     */
    getUsers: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances/' + this.id + '/users',
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.users) {
                callback(err ? err : body);
                return;
            }

            var users = [];

            for (var i = 0; i < body.users.length; i++) {
                users.push(new rackspace.DatabaseUser(self, body.users[i]));
            }

            callback(err, users);
        });
    },

    /**
     * @name Client.createDatabase
     *
     * @description create a new database within the Cloud Database instance
     *
     * @param {Object}     details     the information for your new database
     * @param {Function}   callback    handles the callback of your api call
     */
    createDatabase: function(details, callback) {
        this.createDatabases([ details ], callback);
    },

    createDatabases: function(databases, callback) {
        var self = this,
            data = [];

        _.each(databases, function(details) {

            ['name'].forEach(function(required) {
                if (!details[required]) throw new Error('details.' +
                    required + ' is a required argument.');
            });

            var dbase = {
                name: details.name
            };

            if (details.character_set) {
                dbase.character_set = details.character_set;
            }

            if (details.collate) {
                dbase.collate = details.collate;
            }

            data.push(dbase);
        });

        var requestOptions = {
            uri: '/instances/' + this.id + '/databases',
            method: 'POST',
            data: {
                databases: data
            },
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    },

    /**
     * @name Client.deleteDatabase
     * @description delete a database
     * @param {String}              name                name of the database to delete
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteDatabase: function(name, callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances/' + this.id + '/databases/' + name,
            method: 'DELETE',
            endpoint: rackspace.Endpoints.CloudDatabase
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    },

    /**
     * @name Client.createUser
     *
     * @description create a new database within the Cloud Database instance
     *
     * @param {Object}     details     the information for your new database
     * @param {Function}   callback    handles the callback of your api call
     */
    createUser: function(details, callback) {
        this.createUsers([ details ], callback);
    },

    createUsers: function(users, callback) {
        var self = this,
            data = [];

        _.each(users, function(details) {

            ['name', 'password'].forEach(function(required) {
                if (!details[required]) throw new Error('details.' +
                    required + ' is a required argument.');
            });

            var user = {
                name: details.name,
                password: details.password
            };

            if (details.databases) {
                user.databases = details.databases;
            }

            data.push(user);
        });

        var requestOptions = {
            uri: '/instances/' + this.id + '/users',
            method: 'POST',
            data: {
                users: data
            },
            endpoint: rackspace.Endpoints.CloudDatabases
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    },

    /**
     * @name Client.deleteUser
     * @description delete a database
     * @param {String}              name                name of the database to delete
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteUser: function(name, callback) {
        var self = this;

        var requestOptions = {
            uri: '/instances/' + this.id + '/users/' + name,
            method: 'DELETE',
            endpoint: rackspace.Endpoints.CloudDatabase
        };

        this.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    },

    /**
     * @name DatabaseInstance.setWait
     * @description Continually polls Rackspace Cloud BlockStorage and checks the
     * results against the attributes parameter. When the attributes match
     * the callback will be fired.
     *
     * @param {Object}      attributes  the value to check for during the interval
     * @param {Object}      options    timeout in ms
     * @param {Function}    callback    handles the callback of your api call
     */
    setWait: function(attributes, options, callback) {
        var self = this,
            calledBack = false;

        var equalCheckId = setInterval(function() {

            self.getDetails(function(err, instance) {
                if (err) return; // Ignore errors

                if (options.update) {
                    options.update();
                }

                var equal = true, keys = Object.keys(attributes);
                for (var index in keys) {
                    if (attributes[keys[index]].toLowerCase() !==
                        instance[keys[index]].toLowerCase()) {
                        equal = false;
                        break;
                    }
                }

                if (equal && !calledBack) {
                    finalize(null);
                }
                else if (calledBack) {
                    clearInterval(equalCheckId);
                    clearTimeout(equalTimeoutId);
                }
            });
        }, options.interval);

        var equalTimeoutId = setTimeout(function() {
            if (!calledBack) {
                finalize({ error: 'Max timeout exceeded' });
            }
        }, options.maxWait ? options.maxWait * 1000 : 60 * 30 * 1000);

        function finalize(err) {
            calledBack = true;
            clearInterval(equalCheckId);
            clearTimeout(equalTimeoutId);
            if (options.finish) {
                options.finish();
            }
            callback(err, self);
        }

        return equalCheckId;
    },

    /**
     * @name DatabaseInstance.clearWait
     * @description  Clears a previously setWait for this instance
     * @param {Number}      intervalId      the interval to clear
     */
    clearWait: function(intervalId) {
        clearInterval(intervalId);
    },

    /**
     * @name DatabaseInstance.getDetails
     * @description Update the details of this database instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.client.getDatabaseInstance(this.id, function(err, instance) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(instance);
            callback(null, self);
        });
    },

    destroy: function(callback) {
        this.client.destroyDatabaseInstance(this, callback);
    },

    /**
     * @name DatabaseInstance._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.created_at = details.created_at;
        this.flavor = details.flavor;
        this.hostname = details.hostname;
        this.name = details.name;
        this.status = details.status;
        this.updated = details.updated;
        this.volume = details.volume;
    }
};

exports.DatabaseInstance = DatabaseInstance;
