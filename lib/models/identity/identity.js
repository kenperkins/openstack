/*
 * identity.js: Identity model
 *
 * (C) 2013 Rackspace
 *      Ken Perkins
 * MIT LICENSE
 *
 */

var ServiceCatalog = require('./serviceCatalog').ServiceCatalog;

/**
 * Identity class
 *
 * @description a class for an authorized identity response

 * @param {object}  details     the raw response from the openstack identity call
 * @param {object}  options     any additional options
 * @constructor
 */
var Identity = function(details, options) {
    var self = this;

    options = options || {};

    if (details.access.token) {
        self.token = details.access.token;
        self.token.expires = new Date(self.token.expires);
    }

    if (details.access.serviceCatalog) {
        self.serviceCatalog = new ServiceCatalog(options.region, details.access.serviceCatalog);
    }

    self.user = details.access.user;
    self.raw = details;
};

exports.Identity = Identity;
