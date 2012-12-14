/*
 * image.js: Instance of a single rackspace openstack server image
 *
 * (C) 2012 Clipboard, Inc.
 *
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var Image = function(client, details) {
    if (!details) {
        throw new Error("Image must be constructed with at least basic details.")
    }

    this.client = client;
    this._setProperties(details);
}

Image.prototype = {
    /**
     * @name Image.getDetails
     * @description Update the image details for this instance
     * @param {Function} callback handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        self.client.getImage(this.id, function(err, image) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(image);
            callback(null, self);
        });
    },

    /**
     * @name Image.destroy
     * @description This operation deletes the specified image from the system.
     * @param {Function} callback handles the callback of your api call
     */
    destroy: function(callback) {
        var self = this;

        self.client.destroyImage(self, callback);
    },

    /**
     * @name Image.setWait
     * @description Continually polls Rackspace and checks the
     * results against the attributes parameter. When the attributes match
     * the callback will be fired.
     *
     * @param {Object} attributes the value to check for during the interval
     * @param {Number} interval timeout in ms
     * @param {Function} callback handles the callback of your api call
     */
    setWait: function(attributes, interval, callback) {
        var self = this;
        var equalCheckId = setInterval(function() {

            self.getDetails(function(err, server) {
                if (err) return; // Ignore errors

                var equal = true, keys = Object.keys(attributes);
                for (var index in keys) {
                    if (attributes[keys[index]] !== server[keys[index]]) {
                        equal = false;
                        break;
                    }
                }

                if (equal) {
                    clearInterval(equalCheckId);
                    callback(null, self);
                }
            });
        }, interval);

        return equalCheckId;
    },

    /**
     * @name Image.clearWait
     * @description  Clears a previously setWait for this instance
     * @param {Number} intervalId the interval to clear
     */
    clearWait: function(intervalId) {
        clearInterval(intervalId);
    },

    /**
     * @name Image._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object} details the details to load
     */
    _setProperties: function(details) {
        this.id = details.id;
        this.name = details.name;
        this.updated = details.updated;
        this.created = details.created;
        this.status = details.status;
        this.progress = details.progress;
    }
};

exports.Image = Image;