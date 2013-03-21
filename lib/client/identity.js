var fs = require('fs'),
    models = require('../models'),
    request = require('request');
/**
 * identity.authorize
 *
 * @description authorize against a specific instance of an openstack identity
 * service
 *
 * @param {object}      details      the details of where to call
 * @param {String}      details.url  the authentication endpoint
 * @param {String}      [details.username]      username for the authentication call
 * @param {String}      [details.password]      password for the authentication call
 * @param {String}      [details.token]         token for the authentication call
 * @param {String}      [details.tenantId]      tenantId for the authentication call
 * @param {String}      [details.tenantName]    tenantName for the authentication call
 * @param {String}      [details.region]        default region to use for
 * @param {Function}    callback
 */
exports.authorize = function(details, callback) {

    if (!details || !details.url) {
        throw new Error('Authentication Endpoint is a required detail');
    }

    var options = {
        uri: details.url,
        method: 'POST'
    };

    // setup our inputs for authorization
    if (details.password && details.username) {
        options.json = {
            auth: {
                passwordCredentials: {
                    username: details.username,
                    password: details.password
                }
            }
        };
    }
    // Token and tenant are also valid inputs
    else if (details.token && (details.tenantId || details.tenantName)) {
        options.json = {
            auth: {
                token: {
                    id: details.token
                }
            }
        };
    }
    // whoops, throw an error
    else {
        throw new Error('Must provide (password and username) or (token and tenant)');
    }

    // Are we filtering down by a tenant?
    if (details.tenantId) {
        options.json.auth.tenantId = details.tenantId;
    }
    else if (details.tenantName) {
        options.json.auth.tenantName = details.tenantName;
    }

    request(options, function(err, response, body) {
        if (err || response.statusCode !== 200) {
            callback(err ? err : body);
            return;
        }

        parseIdentity(details.region, body, callback);
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
    var inputFilename = process.cwd() + '/' + token + '.json';

    var raw = require(inputFilename);

    parseIdentity(region, raw, callback);
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

    fs.writeFile(outputFilename, JSON.stringify(identity.raw, null, 4), callback);
};

function parseIdentity(region, data, callback) {

    // asynchronously validate the service catalog before instantiating
    // as the ServiceCatalog constructor throws when provided invalid inputs,
    // but this way we can handle validation as part of a proper async
    // code path and not have to worry about throws
    models.identity.serviceCatalog.validateServiceCatalog(region, data.access.serviceCatalog, function(err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, new models.identity.Identity(data, {
            region: region
        }));
    });
}








