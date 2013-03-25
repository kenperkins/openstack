/*
 * identity.js: Identity for openstack authentication
 *
 * (C) 2013 Rackspace
 *      Ken Perkins
 * MIT LICENSE
 *
 */

var _ = require('underscore'),
    fs = require('fs'),
    request = require('request'),
    ServiceCatalog = require('./serviceCatalog').ServiceCatalog,
    svcCat = require('./serviceCatalog'),
    util = require('util');

/**
 * Identity object
 *
 * @description Base Identity object for Openstack Keystone
 *
 * @param options
 * @constructor
 */
var Identity = function(options) {
    var self = this;

    self.options = options || {};
    self.name = 'OpenstackIdentity';

    _.each(['url', 'region'], function(value) {
        if (!self.options[value]) {
            throw new Error('options.' + value + ' is a required option');
        }
    });
};

Identity.prototype.authorize = function(options, callback) {
    var self = this;

    if (typeof(options) === 'function') {
        callback = options;
        options = {};
    }

    var authenticationOptions = {
        uri: options.url || self.options.url,
        method: 'POST'
    };

    self._buildAuthenticationPayload();

    // we can't be called without a payload
    if (!self._authenticationPayload) {
        process.nextTick(function() {
            callback({
                message: 'Unable to authorize; missing required inputs'
            });
        });
        return;
    }

    // Are we filtering down by a tenant?
    if (self.options.tenantId) {
        self._authenticationPayload.auth.tenantId = self.options.tenantId;
    }
    else if (self.options.tenantName) {
        self._authenticationPayload.auth.tenantName = self.options.tenantName;
    }

    authenticationOptions.json = self._authenticationPayload;

    // Don't keep a copy of the credentials in memory
    delete(self._authenticationPayload);

    request(authenticationOptions, function(err, response, body) {
        if (err || response.statusCode !== 200) {
            callback(err ? err : body);
            return;
        }

        self._parseIdentityResponse(body, callback);
    });
};

Identity.prototype._buildAuthenticationPayload = function() {
    var self = this;

    // setup our inputs for authorization
    if (self.options.password && self.options.username) {
        self._authenticationPayload = {
            auth: {
                passwordCredentials: {
                    username: self.options.username,
                    password: self.options.password
                }
            }
        };
    }
    // Token and tenant are also valid inputs
    else if (self.options.token && (self.options.tenantId || self.options.tenantName)) {
        self._authenticationPayload = {
            auth: {
                token: {
                    id: self.options.token
                }
            }
        };
    }
};

Identity.prototype._parseIdentityResponse = function(data, callback) {
    var self = this;

    svcCat.validateServiceCatalog(self.options.region, data.access.serviceCatalog, function(err) {
        if (err) {
            callback(err);
            return;
        }

        if (data.access.token) {
            self.token = data.access.token;
            self.token.expires = new Date(self.token.expires);
        }

        if (data.access.serviceCatalog) {
            self.serviceCatalog = new ServiceCatalog(self.options.region, data.access.serviceCatalog);
        }

        self.user = data.access.user;
        self.raw = data;

        callback(err, self);
    });
};

exports.createIdentity = function(options, callback) {

    if (typeof(options) === 'function') {
        throw new Error('options is a required argument');
    }
    else if (!options) {
        options = {};
    }

    var id;

    if (options.identity instanceof Identity) {
        id = options.identity;
    }
    else {
        id = new Identity(options);
    }

    id.authorize(options, function(err) {
        if (err) {
            callback(err);
            return;
        }

        callback(err, id);
    });
};

/**
 * identity.loadIdentity
 *
 * @description Loads a cached identity off of disk along with a preferred region
 *
 * @param {String} token
 * @param {String} region
 * @param {Function} callback
 */
exports.loadIdentity = function(token, region, callback) {
    var inputFilename = process.cwd() + '/' + token + '.json',
        raw = require(inputFilename),
        id = new Identity({
            url: raw.options.url,
            region: region
        });

    id._parseIdentityResponse(raw.data, function(err) {
        callback(err, id);
    });
};

/**
 * identity.saveIdentity
 *
 * @description Serializes an identity response to disk as a <token>.json file
 *
 * @param {Identity} identity   the identity to serialize
 * @param {Function} callback
 */
exports.saveIdentity = function(identity, callback) {
    var outputFilename = process.cwd() + '/' + identity.token.id + '.json';

    fs.writeFile(outputFilename, JSON.stringify({
        url: identity.options.url,
        data: identity.options.raw
    }, null, 4), callback);
};

// TODO rationalize if this should be exported
// exports.Identity = Identity;
