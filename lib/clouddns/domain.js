/*
 * domain.js: Instance of a single rackspace openstack domain
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
 *
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

var Domain = function(client, details) {
    if (!details) {
        throw new Error("Domain must be constructed with at-least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

Domain.prototype = {

    /**
     * @name Domain.getRecords
     * @description getRecords retrieves your list of records for this domain
     * @param {Function}    callback    handles the callback of your api call
     */
    getRecords: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + self.id + '/records',
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.records) {
                callback(err);
                return;
            }

            var records = [];

            for (var i = 0; i < body.records.length; i++) {
                records.push(new rackspace.Record(self, body.records[i]));
            }

            callback(err, records);
        });
    },

    /**
     * @name Domain.getRecord
     * @description get the dns record for the provided record id
     * @param {Number}      id          the id of the dns record
     * @param {Function}    callback    handles the callback of your api call
     */
    getRecord: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + self.id + '/records/' + id,
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Record(self, body));
        });
    },

    /**
     * @name Domain.updateRecord
     * @description update a dns record for a given domain
     * @param {Record}      record      the record to update
     * @param {Function}    callback    handles the callback of your api call
     */
    updateRecord: function(record, callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + self.id + '/records/' + record.id,
            method: 'put',
            data: {
                name: record.name,
                data: record.data,
                ttl: record.ttl < 300 ? 300 : record.ttl
            },
            endpoint: rackspace.Endpoints.CloudDns
        };

        if (record.comment) {
            requestOptions.json.comment = record.comment;
        }

        // Add priority for MX and SRV records
        if (record.type === 'MX' || record.type === 'SRV') {
            requestOptions.json.priorty = record.priority;
        }

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Domain.addRecord
     * @description add a dns record for a given domain
     * @param {Object}      options     the new record to create
     * @param {Function}    callback    handles the callback of your api call
     */
    addRecord: function(options, callback) {
        self.addRecords([ options ], callback);
    },

    /**
     * @name Domain.addRecords
     * @description add a set of dns records for a given domain
     * @param {Array}       records     the array of records to create
     * @param {Function}    callback    handles the callback of your api call
     */
    addRecords: function(records, callback) {
        var self = this;

        var data = [];

        _.each(records, function(record) {
            if (!record.type || !record.name || !record.data) {
                return;
            }

            var newRecord = {
                type: record.type,
                data: record.data,
                name: record.name
            };

            if (record.type === 'MX' || record.type === 'SRV') {
                newRecord.priority = record.priority;
            }

            if (record.ttl) {
                newRecord.ttl = record.ttl > 300 ? record.ttl : 300;
            }

            if (record.comment) {
                newRecord.comment = record.comment;
            }

            data.push(newRecord);
        });

        var requestOptions = {
            uri: '/domains/' + self.id + '/records',
            method: 'POST',
            data: {
                records: data
            },
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Domain.deleteRecord
     * @description delete a dns record for a given domain
     * @param {String}      id          the id of the record to delete
     * @param {Function}    callback    handles the callback of your api call
     */
    deleteRecord: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + self.id + '/records/' + id,
            method: 'DELETE',
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Domain.deleteRecords
     * @description deletes multiple dns records for a given domain
     * @param {Array}       records     the array of ids to delete
     * @param {Function}    callback    handles the callback of your api call
     */
    deleteRecords: function(records, callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + self.id + '/records/',
            method: 'DELETE',
            qs: { id: records },
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Domain.getDetails
     * @description Update the domain details for this instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.client.getDomain(this.id, function(err, domain) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(domain);
            callback(null, self);
        });
    },

    /**
     * @name Domain._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.name = details.name;
        this.comment = details.comment || '';
        this.emailAddress = details.emailAddress;
        this.nameservers = details.nameservers || [];
        this.ttl = details.ttl || null; // Must be > 3600
        this.created = details.created;
        this.updated = details.updated;
        this.accountId = details.accountId;
        this.records = details.records || [];
    }
};

exports.Domain = Domain;