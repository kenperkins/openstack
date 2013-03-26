var _ = require('underscore'),
    Container = require('./container'),
    services = require('../client/services');

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

    authorizedRequest: function(details, callback) {
        this.client.authorizedRequest(this.service, details, callback);
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

        self.authorizedRequest(requestOptions,
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

    getContainer: function(name, callback) {
        var self = this;

        var requestOptions = {
            uri: '/' + name,
            method: 'HEAD'
        };

        self.authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                callback(err, new Container(self, {
                    name: name,
                    count: res.headers['x-container-object-count'],
                    bytes: res.headers['x-container-bytes-used']
                }));
            });
    },

    createContainer: function(name, callback) {
        var self = this;

        var requestOptions = {
            uri: '/' + name,
            method: 'PUT'
        };

        self.authorizedRequest(requestOptions,
            function(err, res, body) {
                if (err) {
                    callback(err);
                    return;
                }

                callback(err, new Container(self, {
                    name: name,
                    count: 0,
                    bytes: 0
                }));
            });
    }
};

module.exports = Storage;