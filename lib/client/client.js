var identity = require('../identity'),
    Compute = require('./../compute'),
    Storage = require('./../storage'),
    request = require('request'),
    url = require('url');

exports.createClient = function(options, callback) {

    if (options.loadFromFile && options.token) {
        identity.loadIdentity(options.token, options.region, create);
    }
    else {
        identity.createIdentity(options, create);
    }

    function create(err, auth) {
        if (err) {
            callback(err);
            return;
        }

        var client = new Client(auth, options);

        callback(err, client);
    }

};

var Client = function(auth, options) {

    var self = this;

    self.options = options;
    self.auth = auth;
    self.compute = new Compute(self);
    self.storage = new Storage(self);
};

/**
 * @name Client.authorizedRequest
 *
 * @description Global handler for creating a new authorized request to the provided
 * Openstack API endpoint.
 *
 * @param {Object}      service     The service to use for the specified call
 * @param {Object}    details       provides required values for the request
 * @param {Function}    callback    handles the callback of your api call
 */
Client.prototype.authorizedRequest = function(service, details, callback) {
    var self = this;

    if (!details || !callback) {
        throw new Error('Details and Callback are required');
    }

    ['uri'].forEach(function(required) {
        if (!details[required]) throw new Error('details.' +
            required + ' is a required argument.');
    });

    if (!self.authorized) {
        // TODO do the right thing here
    }

    var requestOptions = {
        uri: service.getEndpointUrl() + details.uri,
        method: details.method || 'GET',
        json: details.data ? details.data : true,
        headers: {
            'X-AUTH-TOKEN': self.auth.token.id
        }
    };

    if (details.qs) {
        requestOptions.qs = details.qs;
    }

    request(requestOptions, function(err, res, body) {
        if (self.options.debug) {
            console.log('DEBUG: URL: ' + requestOptions.uri);
            console.log('DEBUG: METHOD: ' + requestOptions.method);
            if (requestOptions.method !== 'GET') {
                console.log(JSON.stringify(requestOptions.json));
            }
            console.log('DEBUG: StatusCode: ' + res.statusCode);
            console.log('DEBUG: Headers: ');
            console.dir(res.headers);
            console.log('-----');
        }

        callback(err, res, body);
    });
};

exports.Client = Client;
