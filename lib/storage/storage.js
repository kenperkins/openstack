var _ = require('underscore'),
    fs = require('fs'),
    Container = require('./container'),
    request = require('request'),
    services = require('../client/services'),
    StorageObject = require('./storageObject');

/**
 * Storage class
 *
 * @description Storage class is an instance of an openstack storage service
 * client. It provides helper functions for all of the core APIs for storage,
 * as well as objects for Container and StorageObject
 *
 * @param {Client}  client  an instance of an openstack client
 * @param {object}  options     options for your specific instance of the storage client
 * @param {String}  options.serviceName     an optional name for the service from the service catalog
 * @param {String}  options.region          a region to use for the instance of the storage client
 *
 * @constructor
 */
var Storage = function(client, options) {
    var self = this;

    options = options || {};
    options.serviceName = options.serviceName;
    options.type = services.types['object-store'];

    self.client = client;
    self.service = client.auth.serviceCatalog.services[options.serviceName];

    if (!self.service) {
        self.service = client.auth.serviceCatalog.getServiceByType(options.type);
    }

    self.region = options.region || client.options.region;
};

Storage.prototype = {

    /**
     * Storage._authorizedRequest
     *
     * @description helper function for calling the openstack client with the current
     * service.
     * @param details
     * @param callback
     * @returns {*}
     */
    _authorizedRequest: function(details, callback) {
        return this.client.authorizedRequest(this.service, details, callback);
    },

    /**
     * @name Storage.getContainers
     *
     * @description getContainers retrieves your list of servers
     *
     * @param {Object|Function} options provides filters on your servers request
     * @param {Function}    callback    handles the callback of your api call
     */
    getContainers: function(options, callback) {
        var self = this;

        if (typeof(options) === 'function') {
            callback = options;
            options = {};
        }

        var requestOptions = {
            uri: '/'
        };

        requestOptions.qs = _.pick(options,
            'marker',
            'limit',
            'end-marker');

        requestOptions.qs.format = 'json';

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                var containers = [];

                for (var i = 0; i < body.length; i++) {
                    containers.push(new Container(self, body[i]));
                }

                callback(err, containers);
            });
    },

    /**
     * Storage.getContainer
     *
     * @description get an instance of a storage container by name
     *
     * @param {String}      name        the name of the container
     * @param {Function}    callback    the callback to call with (err, Container)
     */
    getContainer: function(name, callback) {
        var self = this;

        var requestOptions = {
            uri: '/' + name,
            method: 'HEAD'
        };

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                var metadata = {};

                _.each(_.keys(res.headers), function(key) {
                    var header = key.split('x-container-meta-');
                    if (header.length === 2) {
                        metadata[header[1]] = res.headers[key];
                    }
                });

                callback(err, new Container(self, {
                    name: name,
                    count: res.headers['x-container-object-count'],
                    bytes: res.headers['x-container-bytes-used'],
                    metadata: metadata
                }));
            });
    },

    /**
     * Storage.createContainer
     *
     * @description create an instance of a storage Container
     *
     * @param {String}      name        the name of the new container
     * @param {object|String|Function}      [metadata]    metadata to set for the new container
     * @param {String|Function}      [readOptions] read options, if any, for the new container
     * @param {Function}    callback    the callback for the operation
     */
    createContainer: function(name, metadata, readOptions, callback) {
        var self = this;

        if (typeof(readOptions) === 'function') {
            callback = readOptions;
            readOptions = '';
        }

        if (typeof(metadata) === 'function') {
            callback = metadata;
            metadata = {};
        }
        else if (typeof (metadata) === 'string') {
            readOptions = metadata;
            metadata = {};
        }

        var requestOptions = {
            uri: '/' + name,
            method: 'PUT',
            headers: {}
        };

        _.each(_.keys(metadata), function(key) {
            requestOptions.headers['X-Container-Meta-' + key] = metadata[key];
        });

        if (readOptions) {
            requestOptions.headers['X-Container-Read'] = readOptions;
        }

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                callback(err, new Container(self, {
                    name: name,
                    count: 0,
                    bytes: 0,
                    metadata: metadata
                }));
            });
    },

    /**
     * Storage.updateContainerMetadata
     *
     * @description updates the named containers metadata
     * @param {String}      name
     * @param {object}      metadata
     * @param {Function}    callback
     */
    updateContainerMetadata: function(name, metadata, callback) {
        var self = this;

        if (typeof(metadata) === 'function') {
            callback = metadata;
            metadata = [];
        }

        var requestOptions = {
            uri: '/' + name,
            method: 'POST',
            headers: {}
        };

        _.each(_.keys(metadata), function(key) {
            requestOptions.headers['X-Container-Meta-' + key] = metadata[key];
        });

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                self.getContainer(name, callback);
            });
    },

    /**
     * Storage.deleteContainerMetadata
     *
     * @description delete's the specified metadata for the named container
     * @param {String}      name
     * @param {object}      metadata
     * @param {Function}    callback
     */
    deleteContainerMetadata: function(name, metadata, callback) {
        var self = this;

        if (!name || !metadata || !callback) {
            throw new Error('missing required arguments');
        }

        var requestOptions = {
            uri: '/' + name,
            method: 'POST',
            headers: {}
        };

        _.each(_.keys(metadata), function(key) {
            requestOptions.headers['X-Remove-Container-Meta-' + key] = metadata[key];
        });

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                self.getContainer(name, callback);
            });
    },

    /**
     * Storage.deleteContainer
     *
     * @description deletes the named container from the storage service
     * @param {String}      name        the name of the container to delete
     * @param {Function}    callback    the callback for the current function
     */
    deleteContainer: function(name, callback) {
        var self = this;

        if (!name) {
            throw new Error('name is a required argument');
        }

        var requestOptions = {
            uri: '/' + name,
            method: 'DELETE'
        };

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }
                else if (res.statusCode === 409) {
                    callback({
                        message: 'There was a conflict when trying to complete your request.',
                        statusCode: res.statusCode
                    });
                    return;
                }
                else if (res.statusCode === 404) {
                    callback({
                        message: 'The specified container was not found.',
                        statusCode: res.statusCode
                    });
                    return;
                }

                callback(err);
            });
    },

    /**
     * Storage.listObjectsForContainer
     *
     * @description list the StorageObjects within the named container
     * @param {Container|String}    container   The container or container name
     * @param {Function}            callback    The callback for the function
     */
    listObjectsForContainer: function(container, callback) {

        var self = this;

        if (container instanceof Container) {
            getObjects(container);
        }
        else {
            self.getContainer(container, function(err, container) {
                if (err) {
                    callback(err);
                    return;
                }

                getObjects(container);

            });
        }

        function getObjects(container) {

            var requestOptions = {
                    uri: '/' + container.name,
                    qs: {
                        format: 'json'
                    }
                };

            self._authorizedRequest(requestOptions,
                function(err, res, body) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    var storageObjects = [];

                    for (var i = 0; i < body.length; i++) {
                        storageObjects.push(new StorageObject(container, body[i]));
                    }

                    callback(err, storageObjects);
                });
        }
    },

    /**
     * Storage.createObjectFromStream
     *
     * @description create a new StorageObject from a specified readable Stream
     * @param {object}      options         a list of options for the creation
     * @param {Container|String}    options.container   the container or container name for the new StorageObject
     * @param {String}              options.name        the name for the new StorageObject
     * @param {Stream}              options.stream      the stream for the new StorageObject
     * @param {object}              [options.metadata]    optional metadata for the StorageObject
     * @param {Function}            callback            the callback for the function
     */
    createObjectFromStream: function(options, callback) {

        if (!options && !callback) {
            throw new Error('missing required parameters');
        }

        _.each(['container', 'name', 'stream'], function(key) {
            if (!options[key]) throw new Error('options.' + key + ' is a required parameter');
        });

        options.metadata = options.metadata || {};

        var self = this,
            requestOptions = {
                uri: '/' + (options.container instanceof Container ?
                    options.container.name : options.container)  + '/' + options.name,
                stream: options.stream,
                method: 'PUT',
                headers: {}
            };

        // Sanitize the input streams headers, if any
        // Depends on a checkin to request module master branch
        options.stream.on('response', function(response) {
            response.headers = {
                'content-type': response.headers['content-type'],
                'content-length': response.headers['content-length']
            }
            console.dir(response.headers);
        });

        _.each(_.keys(options.metadata), function(key) {
            requestOptions.headers['X-Object-Meta-' + key] = options.metadata[key];
        });

        self._authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                console.dir(body);
                callback();
            });
    },

    /**
     * Storage.createObjectFromUrl
     *
     * @description helper function to create a StorageObject from a URL
     * @param {String}      url         the url to use in creation
     * @param {object}      options     options for the StorageObject
     * @param {Container|String}    options.container   the container or container name for the new StorageObject
     * @param {String}              options.name        the name for the new StorageObject
     * @param {object}              [options.metadata]    optional metadata for the StorageObject
     * @param callback
     */
    createObjectFromUrl: function(url, options, callback) {
        this.createObjectFromStream(_.extend({
            stream: request(url)
        }, options), callback);
    },

    /**
     * Storage.createObjectFromPath
     *
     * @description helper function to create a StorageObject from a local path
     * @param {String}      path         the path to use in creation
     * @param {object}      options     options for the StorageObject
     * @param {Container|String}    options.container   the container or container name for the new StorageObject
     * @param {String}              options.name        the name for the new StorageObject
     * @param {object}              [options.metadata]    optional metadata for the StorageObject
     * @param callback
     */
    createObjectFromPath: function(path, options, callback) {
        this.createObjectFromStream(_.extend({
            stream: fs.createReadStream(path)
        }, options), callback);
    },

    /**
     * Storage.deleteObject
     *
     * @description delete a named StorageObject from the specified container
     * @param {Container|String}    container       the container or name to delete from
     * @param {StorageObject|String}storageObject   the storageobject or name to delete
     * @param {Funtion}             callback        the callback for the function
     */
    deleteObject: function(container, storageObject, callback) {
        var self = this,
            containerName = container,
            storageObjectName = storageObject;

        if (container instanceof Container) {
            containerName = container.name;
        }

        if (storageObject instanceof StorageObject) {
            storageObjectName = storageObject.name;
        }

        var deleteOptions = {
            method: 'DELETE',
            uri: '/' + containerName + '/' + storageObjectName
        };

        self._authorizedRequest(deleteOptions, function(err, res) {
            if (err || res.statusCode !== 204) {
                callback(err);
                return;
            }

            callback(err, true);
        });
    },

    /**
     * Storage.downloadObject
     *
     * @description download a StorageObject to the local system
     * @param {Container|String}        container       the container for the download
     * @param {StorageObject|String}    storageObject   the storageObject to download
     * @param {String}                  path            the path to save the StorageObject to
     * @param {Function}                callback        the callback for the operation
     */
    downloadObject: function(container, storageObject, path, callback) {
        this.streamObject(container, storageObject, fs.createWriteStream(path), callback);
    },

    /**
     * Storage.streamObject
     *
     * @description stream a StorageObject to a writable Stream
     * @param {Container|String}        container       the container for the download
     * @param {StorageObject|String}    storageObject   the storageObject to download
     * @param {Stream}                  stream          the writableStream to use for the StorageObject
     * @param {Function}                callback        the callback for the operation
     */
    streamObject: function(container, storageObject, stream, callback) {
        var self = this,
            containerName = container,
            storageObjectName = storageObject;

        if (container instanceof Container) {
            containerName = container.name;
        }

        if (storageObject instanceof StorageObject) {
            storageObjectName = storageObject.name;
        }

        var requestOptions = {
            uri: '/' + containerName + '/' + storageObjectName
        }

        self._authorizedRequest(requestOptions,function(err, res) {
            if (err || res.statusCode !== 204) {
                callback(err);
                return;
            }

            callback(err, true);
        }).pipe(stream);
    },

//    getObjectMetadata: function(container, storageObject, callback) {
//        var self = this,
//            containerName = container,
//            storageObjectName = storageObject;
//
//        if (container instanceof Container) {
//            containerName = container.name;
//        }
//
//        if (storageObject instanceof StorageObject) {
//            storageObjectName = storageObject.name;
//        }
//
//        var requestOptions = {
//            uri: '/' + containerName + '/' + storageObjectName,
//            method: 'HEAD'
//        }
//
//        self._authorizedRequest(requestOptions, function(err, res) {
//            if (err || res.statusCode !== 200) {
//                callback(err);
//                return;
//            }
//
//            callback(err, new StorageObject({
//                name: storageObjectName,
//            }))
//        })
//    },

    /**
     * Storage.updateObjectMetadata
     *
     * @description update the metadata for a StorageObject
     * @param {Container|String}        container       the container for the download
     * @param {object}                  details         the details for the update
     * @param {String}                  details.name    the name of the StorageObject
     * @param {object}                  details.metadata   the metadata to update
     * @param {Function}                callback        the callback for the operation
     */
    updateObjectMetadata: function(container, details, callback) {
        var self = this,
            containerName = container;

        if (container instanceof Container) {
            containerName = container.name;
        }

        _.each(_.keys(details.metadata), function(key) {
            requestOptions.headers['X-Object-Meta-' + key] = details.metadata[key];
        });

        var requestOptions = {
            uri: '/' + containerName + '/' + details.name,
            method: 'POST',
            headers: {}
        };

        self._authorizedRequest(requestOptions, function(err, res) {
            if (err || res.statusCode !== 202) {
                callback(err);
                return;
            }

            self.getObjectMetadata(container, details.name, callback);
        })
    }
};

module.exports = Storage;