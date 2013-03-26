/*
 * container.js: Instance of an openstack storage container
 *
 * (C) 2013 Ken Perkins

 * MIT LICENSE
 *
 */
var Container = function(service, details) {
    if (!details) {
        throw new Error("Container must be constructed with at-least basic details.")
    }

    this.service = service;
    this._setProperties(details);
};

Container.prototype = {
    /**
     * @name Container.getDetails
     * @description Update the container details for this instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.service.getContainer(this.name, function(err, container) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(container);
            callback(null, self);
        });
    },

    /**
     * @name Container._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     * @param {String}      details.name     the name of the container
     * @param {Number}      details.count    count of objects in the container
     * @param {Number}      details.bytes    number of bytes in the container
     */
    _setProperties: function(details) {
        this.name = details.name;
        this.count = details.count;
        this.bytes = details.bytes;
    },

    toJSON: function() {
        return JSON.stringify({
            name: this.name,
            count: this.count,
            bytes: this.bytes
        });
    }
};

module.exports = Container;