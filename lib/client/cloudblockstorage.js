var rackspace = require('../rackspace-openstack'),
    _ = require('underscore');

exports.CloudBlockStorage = {

    /**
     * @name Client.getVolumes
     *
     * @description getVolumes retrieves your list of volumes
     *
     * @param {Function}            callback    handles the callback of your api call
     */
    getVolumes: function(callback) {
        var self = this;

        var requestOptions = {
            uri: '/volumes',
            endpoint: rackspace.Endpoints.CloudBlockStorage
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.volumes) {
                callback(err ? err : body);
                return;
            }

            var volumes = [];

            for (var i = 0; i < body.volumes.length; i++) {
                volumes.push(new rackspace.Volume(self, body.volumes[i]));
            }

            callback(err, volumes);
        });
    },

    /**
     * @name Client.getVolume
     *
     * @description Gets the details for a specified volume id
     *
     * @param {String}      id          the id of the requested volume
     * @param {Function}    callback    handles the callback of your api call
     */
    getVolume: function(id, callback) {
        var self = this;

        var requestOptions = {
            uri: '/volumes/' + id,
            endpoint: rackspace.Endpoints.CloudBlockStorage
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.volume) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.Volume(self, body.volume));
        });
    },

    /**
     * @name Client.createVolume
     *
     * @description create a new cloud block storage volume
     *
     * @param {Object}     details     the information for your new volume
     * @param {Function}   callback    handles the callback of your api call
     */
    createVolume: function(details, callback) {
        var self = this;

        ['size'].forEach(function(required) {
            if (!details[required]) throw new Error('details.' +
                required + ' is a required argument.');
        });

        var volume = {
            size: details.size
        };

        if (details.display_description) {
            volume.display_description = details.display_description;
        }

        if (details.display_name) {
            volume.display_name = details.display_name;
        }

        if (details.snapshot_id) {
            volume.snapshot_id = details.snapshot_id;
        }

        if (details.volume_type) {
            volume.volume_type = details.volume_type;
        }

        var requestOptions = {
            uri: '/volumes',
            method: 'POST',
            data: {
                volume: volume
            },
            endpoint: rackspace.Endpoints.CloudBlockStorage
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200) {
                callback(err ? err : body);
                return;
            }

            callback(err, new rackspace.Volume(self, body.volume));
        });
    },

    /**
     * @name Client.createVolumeWithWait
     *
     * @description Creates a cloud blockstorage volume and waits for the volume to be in Active Status
     *
     * @param {Object}              details     the volume details to use in building your volume
     * @param {Object|Function}     options     optional parameters used for volume creation
     * @param {Function}            callback    handles the callback of your api call
     */
    createVolumeWithWait: function(details, options, callback) {
        var self = this;

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        self.createVolume(details, function(err, volume) {
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

            volume.setWait({ status: 'ACTIVE' }, waitOptions, function(err, volume) {
                callback(err, volume);
            });
        });
    },

    /**
     * @name Client.deleteVolume
     * @description delete a volume
     * @param {String}              volumeId            Id of the volume to delete
     * @param {Function}            callback            handles the callback of your api call
     */
    deleteVolume: function(volumeId, callback) {
        var self = this;

        var requestOptions = {
            uri: '/volumes/' + volumeId,
            method: 'DELETE',
            endpoint: rackspace.Endpoints.CloudBlockStorage
        };

        self.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 202) {
                callback(err ? err : body);
                return;
            }

            callback(err);
        });
    }
};