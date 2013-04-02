/*
 * container.js: Instance of an openstack storage container
 *
 * (C) 2013 Ken Perkins

 * MIT LICENSE
 *
 */

var _ = require('underscore'),
    StorageObject = require('./storageObject');

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

    update: function(callback) {
        var self = this;

        this.service.updateContainerMetadata(this.name, this.metadata, function(err, container) {
            if (err) {
                callback(err);
                return;
            }

            self = container;
            callback();
        });
    },

    listObjects: function(callback) {
        var self = this;

        self.service.listObjectsForContainer(self.name, callback);
    },

    createObjectFromPath: function(path, options, callback) {
        this.service.createObjectFromPath(path, _.extend({
            container: this
        }, options), callback);
    },

    createObjectFromUrl: function(url, options, callback) {
        this.service.createObjectFromUrl(url, _.extend({
            container: this
        }, options), callback);
    },

    deleteObject: function(storageObject, callback) {
        this.service.deleteObject(this, storageObject, callback);
    },

    downloadObject: function(storageObject, path, callback) {
        this.service.downloadObject(this, storageObject, path, callback);
    },

    streamObject: function(storageObject, stream, callback) {
        this.service.streamObject(this, storageObject, stream, callback);
    },

    updateObjectMetadata: function(details, callback) {
        this.service.updateObjectMetadata(this, details, callback);
    },

    /**
     * @name Container._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     * @param {String}      details.name     the name of the container
     * @param {Number}      details.count    count of objects in the container
     * @param {Number}      details.bytes    number of bytes in the container
     * @param {object}      details.metadata    metadata for the current container
     */
    _setProperties: function(details) {
        this.name = details.name;
        this.count = details.count;
        this.bytes = details.bytes;
        this.metadata = details.metadata || {};
        this.url = this.service.service.getEndpointUrl() + '/' + this.name;
    },

    toJSON: function() {
        return JSON.stringify({
            name: this.name,
            count: this.count,
            bytes: this.bytes,
            metadata: this.metadata,
            url: this.url
        });
    }
};

module.exports = Container;