/*
 * record.js: Instance of a single rackspace openstack flavor
 *
 * (C) 2012 Ken Perkins
 *
 * Inspired by node-cloudservers from Nodejitsu &
 *      clouddns from davidandrewcope
  *
 * MIT LICENSE
 *
 */
var Record = function(domain, details) {
    if (!details) {
        throw new Error("Record must be constructed with at-least basic details.")
    }

    this.domain = domain;
    this._setProperties(details);
};

Record.prototype = {
    /**
     * @name Record.getDetails
     *
     * @description Update the flavor details for this instance
     *
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
            this.domain.getRecord(this.id, function(err, record) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(record);
            callback(null, self);
        });
    },

    /**
     * @name Record.update
     *
     * @description updates the current record
     *
     * @param {Function}      callback     handles the callback of your api call
     */
    update: function(callback) {
        self.domain.updateRecord(self, callback);
    },

    /**
     * @name Record.destroy
     *
     * @description deletes the current record
     *
     * @param {Function}      callback     handles the callback of your api call
     */
    destroy: function(callback) {
        self.domain.deleteRecord(self.id, callback);
    },

    /**
     * @name Record._setProperties
     *
     * @description Loads the properties of an object into this instance
     *
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.name = details.name;
        this.type = details.type;
        this.data = details.data;
        this.ttl = details.ttl; // Must be > 300
        this.created = details.created;
        this.updated = details.updated;
    }
};

exports.Record = Record;