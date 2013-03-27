/*
 * server.js: Instance of a single rackspace openstack server
 *
 * (C) 2012 Ken Perkins
 *
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var rackspace = require('../rackspace-openstack');

var Server = function(client, details) {
    if (!details) {
        throw new Error("Server must be constructed with at least basic details.")
    }

    this.client = client;
    this._setProperties(details);
};

Server.prototype = {

    /**
     * @name Server.doServerAction
     * @description Wrapper for a series of server action api calls,
     * including resize, rebuild confirmResize, revertResize, among others
     * @param {Object}      options     provides the data and optional expected
     * status for the response
     *
     * @param {Function}    callback    handles the callback of your api call
     */
    doServerAction: function(options, callback) {
        var self = this, action, expectedStatus;

        if (!options.action) throw new Error('options.action is a required argument.');

        expectedStatus = options.expectedStatus ? options.expectedStatus : 202;
        action = options.action;

        var requestOptions = {
            uri: '/servers/' + self.id + '/action',
            method: 'POST',
            data: action
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err);
                return;
            }

            callback(err, res.statusCode === expectedStatus);
        });
    },

    /**
     * @name Server.confirmResize
     * @description makes a Server.doServerAction call to sign off on the
     * server resize. Removes the previous server at Rackspace and it
     * cannot be rolled back to.
     * @param {Function}    callback    handles the callback of your api call
     */
    confirmResize: function(callback) {
        this.doServerAction(
            {
                action: { 'confirmResize': null },
                expectedStatus: 204
            }, callback);
    },

    /**
     * @name Server.destroy
     * @description Deletes this instance from Rackspace
     * @param {Function}    callback    handles the callback of your api call
     */
    destroy: function(callback) {
        this.client.destroyServer(this, callback);
    },

    /**
     * @name Server.getAddresses
     * @description Gets the network addresses for the server, optionally
     * specifying a specific network ID
     * @param {String|Function} network     id if provided, otherwise is all
     * @param {Function}        callback    handles the callback of your api call
     */
    getAddresses: function(network, callback) {
        var self = this,
            uri = '/servers/' + self.id + '/ips';

        if (typeof(network) !== 'function') {
            callback = network;
        }
        else {
            uri += '/' + network;
        }

        var requestOptions = {
            uri: uri
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err);
                return;
            }

            callback(err, body.addresses ? body.addresses : body.network);
        });
    },

    /**
     * @name Server.getVolumes
     * @descriptiong Get the list of attached volumes for this server
     * @param {Function}    callback    handles the callback of your api call
     */
    getVolumes: function(callback) {
        var self = this,
            uri = '/servers/' + self.id + '/os-volume_attachments';

        var requestOptions = {
            uri: uri
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err ? err : body);
                return;
            }

            callback(err, body.volumeAttachments);
        });
    },

    /**
     * @name Server.getVolume
     * @descriptiong Get the details for a specified attached volume
     * @param {String}      attachmentId    the attached volume id to get details for
     * @param {Function}    callback        handles the callback of your api call
     */
    getVolume: function(attachmentId, callback) {
        var self = this,
            uri = '/servers/' + self.id + '/os-volume_attachments/' + attachmentId;

        var requestOptions = {
            uri: uri
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.volumeAttachment) {
                callback(err ? err : body);
                return;
            }

            callback(err, body.volumeAttachment);
        });
    },

    /**
     * @name Server.attachVolume
     * @descriptiong attach a cloud block storage volume to this server
     * @param {Object}     details     details of the volume to attach
     * @param {Function}    callback    handles the callback of your api call
     */
    attachVolume: function(details, callback) {
        var self = this,
            uri = '/servers/' + self.id + '/os-volume_attachments';

        var requestOptions = {
            uri: uri,
            method: 'POST',
            data: {
                volumeAttachment: details
            }
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || !body.volumeAttachment) {
                callback(err ? err : body);
                return;
            }

            self.client.getVolume(details.volumeId, function(err, volume) {
                volume.setWait({ status: 'in-use' }, 5000, function() {
                    callback(err, volume);
                });
            });
        });
    },

    /**
     * @name Server.detachVolume
     * @descriptiong detach a cloud block storage volume from this server
     * @param {String}      attachmentId    attachment Id to remove
     * @param {Function}    callback        handles the callback of your api call
     */
    detachVolume: function(attachmentId, callback) {
        var self = this,
            uri = '/servers/' + self.id + '/os-volume_attachments/' + attachmentId;

        var requestOptions = {
            uri: uri,
            method: 'DELETE'
        };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err) {
                callback(err);
                return;
            }

            self.client.getVolume(attachmentId, function(err, volume) {
                volume.setWait({ status: 'available' }, 5000, function() {
                    callback(err, volume);
                });
            });
        });
    },

    /**
     * @name Server.getDetails
     * @description Update the server details for this instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.client.getServer(this.id, function(err, server) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(server);
            callback(null, self);
        });
    },

    /**
     * @name Server.reboot
     * @description reboots the server, optionally providing type of reboot.
     * @param {String|Function} type        An optional string (soft|hard) for the
     * reboot. Soft is default if not provided.
     *
     * @param {Function}        callback    handles the callback of your api call
     */
    reboot: function(type, callback) {

        if (typeof(type) === 'function') {
            callback = type;
            type = 'soft';
        }

        this.doServerAction(
            {
                action: {
                    'reboot': { 'type': type.toUpperCase() }
                }
            }, callback);
    },

    /**
     * @name Server.rebuild
     * @description Rebuilds this instance with the specified image. This
     * will delete all data on the server instance. The 'image' can
     * be an instance of a rackspace-openstack Image or an image id.
     * @param {Object|Function}     options     Optionally provide a new set of
     * server options to be used while rebuilding.
     *
     * @param {Function}            callback    handles the callback of your api call
     */
    rebuild: function(options, callback) {

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        var serverOptions = {};

        serverOptions.name = options.name || this.name;
        serverOptions.imageRef = options.imageRef || this.image.id;
        serverOptions.flavorRef = options.flavorRef || this.flavor.id;
        serverOptions.metadata = options.metadata || this.metadata;
        serverOptions.personality = options.personality || this.personality;

        // Don't specify the admin pass unless it's explicit
        if (options.adminPass) {
            serverOptions.adminPass = options.adminPass;
        }

        this.doServerAction(
            {
                action: {
                    'rebuild': serverOptions
                }
            }, callback);
    },

    /**
     * @name Server.resize
     * @description Resizes this instance to another flavor. In essence scaling
     * the server up or down. The original server is saved for a period of time
     * to rollback if there is a problem. The 'flavor' can be an instance of a
     * rackspace-openstack Flavor or a flavor id.
     * @param {Object|String}   flavor      Provide the Flavor or flavor id to
     * be used when resizing this server
     *
     * @param {Function}        callback    handles the callback of your api call
     */
    resize: function(flavor, callback) {
        var flavorId = flavor instanceof rackspace.Flavor ? flavor.id : flavor;

        this.doServerAction(
            {
                action: {
                    'resize': { 'flavorRef': flavorId }
                }
            }, callback);
    },

    /**
     * @name Server.revertResize
     * @description Rollback this server the saved image from before the resize
     * @param {Function}    callback    handles the callback of your api call
     */
    revertResize: function(callback) {
        this.doServerAction(
            {
                action: { 'revertResize': null }
            }, callback);
    },

    /**
     * @name Server.changeName
     * @description Change the name of this server. Does not change the hostname
     * @param {String}      name        The new name of the server
     * @param {Function}    callback    handles the callback of your api call
     */
    changeName: function(name, callback) {

        var self = this,
            updateOptions = {
                method: 'PUT',
                uri: '/servers' + this.id,
                data: {
                    'server': {
                        'name': name
                    }
                }
            };

        this.client.authorizedRequest(updateOptions, function(err, res, body) {
            if (err || !body.server) {
                callback(err);
                return;
            }

            self._setProperties(body.server);
            callback(err, res.statusCode === 200);
        });
    },

    /**
     * @name Server.changeAdminPassword
     * @description Changes the administrator password for a VM
     * @param {String}      newPassword     The new password for the server administrator
     * @param {Function}    callback        handles the callback of your api call
     */
    changeAdminPassword: function(newPassword, callback) {
        this.doServerAction(
            {
                action: {
                    changePassword: {
                        adminPass: newPassword
                    }
                }
            }, callback);
    },

    /**
     * @name Server.rescue
     * @description Enter rescue mode to reboot a virtual machine (VM) in rescue
     * mode so that you can access the VM with a new root password and fix any
     * file system and configuration errors.
     *
     * Doesn't use Server.doServerAction as we need to handle the custom response
     *
     * @param {Function}    callback    handles the callback of your api call
     */
    rescue: function(callback) {
        var self = this,
            requestOptions = {
                uri: '/servers/' + this.id + '/action',
                method: 'POST',
                data: {
                    action: {
                        rescue: 'none'
                    }
                }
            };

        self.client.authorizedRequest(requestOptions, function(err, res, body) {
            if (err || res.statusCode !== 200 || !body.adminPass) {
                callback(err);
                return;
            }

            callback(err, body);
        });
    },

    /**
     * @name Server.unrescue
     * @description After you resolve any problems and reboot a rescued server,
     * you can unrescue the server. When you unrescue the server, the repaired
     * image is restored to its running state with your original password.
     *
     * @param {Function}    callback    handles the callback of your api call
     */
    unrescue: function(callback) {
        this.doServerAction(
            {
                action: {
                    unrescue: null
                }
            }, callback);
    },

    /**
     * @name Server.createImage
     * @description This operation creates a new image for a specified server.
     * Once complete, a new image is available that you can use to rebuild or
     * create servers.
     *
     * Doesn't use Server.doServerAction as we need to handle the custom response
     *
     * @param {Object}      options     Attributes for your new server
     * @param {Function}    callback    handles the callback of your api call
     */
    createImage: function(options, callback) {
        this.client.createServerImage({
            name: options.name,
            server: this
        }, callback);
    },

    /**
     * @name Server.setWait
     * @description Continually polls Rackspace CloudServers and checks the
     * results against the attributes parameter. When the attributes match
     * the callback will be fired.
     *
     * @param {Object|Function}   attributes   the value to check for during the interval.
     * can also be a function that returns a true or false value to indicate a match.
     * @param {Number}     options.interval    polling period in miliseconds
     * @param {Number}     options.maxWait     max time to wait in seconds
     * @param {Function}   options.update      called after each poll of the server
     * @param {Function}   options.finish      called when the wait is over (no args)
     * see if the server is ready.  passed the server object as an argument.
     * @param {Function}    callback    handles the callback of your api call
     */
    setWait: function(attributes, options, callback) {
        var self = this,
            calledBack = false,
            checkStatus = false;

        if ((typeof attributes) === 'function') {
            checkStatus = attributes;
            attributes = false;
        }

        var equalCheckId = setInterval(function() {

            self.getDetails(function(err, server) {
                if (err) return; // Ignore errors

                if (options.update) {
                    options.update();
                }
                
                if (attributes) {
                    var equal = true, keys = Object.keys(attributes);
                    for (var index in keys) {
                        if (attributes[keys[index]] !== server[keys[index]]) {
                            equal = false;
                            break;
                        }
                    }
                }
                else if (checkStatus) {
                    equal = checkStatus(server);
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
     * @name Server.clearWait
     * @description  Clears a previously setWait for this instance
     * @param {Number}      intervalId      the interval to clear
     */
    clearWait: function(intervalId) {
        clearInterval(intervalId);
    },

    /**
     * @name Server._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     */
    _setProperties: function(details) {
        // Set core properties
        this.id = details.id;
        this.name = details.name;

        // Only set these if present
        if (details.flavor && typeof(details.flavor) === 'object') {
            this.flavor = details.flavor;
        }

        if (details.image && typeof(details.image) === 'object') {
            this.image = details.image;
        }

        // Additional Properties
        this.progress = details.progress || this.progress;
        this.adminPass = details.adminPass || this.adminPass;
        this.status = details.status || this.status;
        this.hostId = details.hostId || this.hostId;
        this.addresses = details.addresses || {};
        this.metadata = details.metadata || {};
        this.accessIPv4 = details.accessIPv4;
        this.accessIPv6 = details.accessIPv6;
    }
}

exports.Server = Server;
