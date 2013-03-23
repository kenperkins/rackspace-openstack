/*
 * user.js: Instance of a rackspace cloud databases database
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

var Database = function(instance, details) {
    if (!details) {
        throw new Error('Database must be constructed with at-least basic details.')
    }

    this.instance = instance;
    this._setProperties(details);
};

Database.prototype = {

    /**
     * @name Database._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.name = details.name;
        this.character_set = details.character_set;
        this.collate = details.collate;
    }
};

exports.Database = Database;
