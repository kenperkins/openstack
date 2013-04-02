/*
 * storageObject.js: Instance of an openstack storage object
 *
 * (C) 2013 Ken Perkins

 * MIT LICENSE
 *
 */
var StorageObject = function(container, details) {
    if (!details) {
        throw new Error("StorageObject must be constructed with at-least basic details.")
    }

    this.container = container;
    this._setProperties(details);
};

StorageObject.prototype = {
    /**
     * @name Container.getDetails
     * @description Update the container details for this instance
     * @param {Function}    callback    handles the callback of your api call
     */
    getDetails: function(callback) {
        var self = this;
        this.container.getStorageObject(this.name, function(err, storageObject) {
            if (err) {
                callback(err);
                return;
            }

            self._setProperties(storageObject);
            callback(null, self);
        });
    },

    updateMetadata: function(callback) {
        this.container.updateObjectMetadata({
            name: this.name,
            metadata: this.metadata
        }, callback);
    },

    deleteObject: function(callback) {
        this.container.deleteObject(this, callback);
    },

    download: function(path, callback) {
        this.container.downloadObject(this, path + '/' + this.name, callback);
    },

    stream: function(stream, callback) {
        this.container.streamObject(this, stream, callback);
    },

    /**
     * @name StorageObject._setProperties
     * @description Loads the properties of an object into this instance
     * @param {Object}      details     the details to load
     * @param {String}      details.name     the name of the storage object
     * @param {String}      details.hash     MD5 hash of the storage object
     * @param {Number}      details.bytes    number of bytes in the storage object
     * @param {object}      details.metadata    metadata for the current storage object
     * @param {String}      details.content_type    Content-Type for the storage object
     * @param {String}      details.last_modified   Last modified Date
     */
    _setProperties: function(details) {
        this.name = details.name;
        this.hash = details.hash;
        this.bytes = details.bytes;
        this.metadata = details.metadata || {};
        this['content_type'] = details['content_type'];
        this['last_modified'] = new Date(details['last_modified']);
        this.url = this.container.url + '/' + this.name;
    },

    toJSON: function() {
        return JSON.stringify({
            name: this.name,
            hash: this.hash,
            bytes: this.bytes,
            metadata: this.metadata,
            'content_type': this['content_type'],
            'last_modified': this['last_modified'],
            url: this.url
        });
    }
};

module.exports = StorageObject;