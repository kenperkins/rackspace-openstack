/*
 * user.js: Instance of a rackspace cloud databases user
 *
 * (C) 2013 Andrew Regner
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
 *
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack');

var DatabaseUser = function(instance, details) {
    if (!details) {
        throw new Error('DatabaseUser must be constructed with at-least basic details.')
    }

    this.instance = instance;
    this._setProperties(details);
};

DatabaseUser.prototype = {

    /**
     * @name DatabaseUser._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        var self = this;
        this.name = details.name;
        this.password = details.password;

        if (details.databases) {
            var dbs = [];

            for (var i = 0; i < details.databases.length; i++) {
                dbs.push(new rackspace.Database(self.instance, details.databases[i]));
            }

            this.databases = dbs;
        }
    }
};

exports.DatabaseUser = DatabaseUser;
