var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

/**
 * @name Client.getDomains
 *
 * @description getDomains retrieves your list of domains
 *
 * @param {Object|Function}     details     provides filters on your domains request
 * @param {Function}            callback    handles the callback of your api call
 */
exports.CloudDns = {
    getDomains: function(details, callback) {
        var self = this;

        if (typeof(details) === 'function') {
            callback = details;
            details = {};
        }

        var requestOptions = {
            uri: '/domains',
            endpoint: rackspace.Endpoints.CloudDns
        };

        requestOptions.qs = _.pick(details,
            'name');

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.domains) {
                callback(err);
                return;
            }

            var domains = [];

            for (var i = 0; i < body.domains.length; i++) {
                domains.push(new rackspace.Domain(self, body.domains[i]));
            }

            callback(err, domains);
        });
    },

    /**
     * @name Client.getDomain
     *
     * @description Gets the details for a specified domain id
     *
     * @param {String}      id          the domain id of the requested domain
     * @param {Function}    callback    handles the callback of your api call
     */
    getDomain: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/domains/' + id,
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Domain(self, body));
        });
    },

    /**
     * @name Client.createDomain
     *
     * @description register a new domain in the rackspace domain manager
     *
     * @param {Object}     details     the information for your new domain
     * @param {Function}   callback    handles the callback of your api call
     */
    createDomain: function(details, callback) {
        var self = this;

        ['name', 'emailAddress'].forEach(function(required) {
            if (!details[required]) throw new Error('details.' +
                required + ' is a required argument.');
        });

        var newDomain = {
            name: details.name,
            emailAddress: details.emailAddress
        };

        if (details.ttl && typeof(details.ttl) === 'number' && details.ttl >= 300) {
            newDomain.ttl = details.ttl;
        }

        if (details.comment) {
            newDomain.comment = details.comment;
        }

        var requestOptions = {
            uri: '/domains',
            method: 'POST',
            data: newDomain,
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Client.importDomain
     *
     * @description This call provisions a new DNS domain under the account
     * specified by the BIND 9 formatted file configuration contents defined
     * in the request object.
     *
     * @param {Object}     details     the information for your new domain
     * @param {Function}   callback    handles the callback of your api call
     */
    importDomain: function(details, callback) {
        var self = this;

        ['contentType', 'contents'].forEach(function(required) {
            if (!details[required]) throw new Error('details.' +
                required + ' is a required argument.');
        });

        if (details.contentType !== 'BIND_9') {
            callback({ invalidRequest: true });
            return;
        }

        var importedDomain = {
            contentType: details.contentType,
            contents: details.contents
        };

        var requestOptions = {
            uri: '/domains/import',
            method: 'POST',
            data: importedDomain,
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Client.updateDomain
     * @description update a domain
     * @param {Domain}      domain      the domain to update
     * @param {Function}    callback    handles the callback of your api call
     */
    updateDomain: function(domain, callback) {
        this.updateDomains([ domain ], callback);
    },

    /**
     * @name Client.updateDomains
     * @description update an array of domains
     * @param {Array}       domains     the array of domains to update
     * @param {Function}    callback    handles the callback of your api call
     */
    updateDomains: function(domains, callback) {
        var self = this;

        var data = [];

        _.each(domains, function(domain) {
            if (!domain.type || !domain.name || !domain.data) {
                return;
            }

            var update = {
                id: domain.id,
                ttl: domain.ttl,
                emailAddress: domain.emailAddress,
                comment: domain.comment
            };

            data.push(update);
        });

        var requestOptions = {
            uri: '/domains/' + self.id,
            method: 'PUT',
            data: {
                domains: data
            },
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    },

    /**
     * @name Client.deleteDomain
     * @description delete a domain
     * @param {Domain}              domain              the domain to delete
     * @param {Boolean|Function}    deleteSubdomains    remove subdomains? true by default
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteDomain: function(domain, deleteSubdomains, callback) {
        this.deleteDomains([ domain ], deleteSubdomains, callback);
    },

    /**
     * @name Client.deleteDomains
     * @description delete an array of domains
     * @param {Array}               domains             the array of domains to delete
     * @param {Boolean|Function}    deleteSubdomains    remove subdomains? true by default
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteDomains: function(domains, deleteSubdomains, callback) {
        var self = this;

        if (typeof(deleteSubdomains) === 'function') {
            callback = deleteSubdomains;
            deleteSubdomains = true;
        }

        var domainIds = [];

        _.each(domains, function(domain) {
            if (!domain.type || !domain.name || !domain.data) {
                return;
            }

            domainIds.push(domain.id);
        });

        var requestOptions = {
            uri: '/domains/' + self.id,
            method: 'DELETE',
            qs: {
                id: domainIds,
                deleteSubdomains: deleteSubdomains
            },
            endpoint: rackspace.Endpoints.CloudDns
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            callback(err, new rackspace.Status(self.client, body));
        });
    }
};