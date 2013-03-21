/*
 * serviceCatalog.js: ServiceCatalog model
 *
 * (C) 2013 Rackspace
 *      Ken Perkins
 * MIT LICENSE
 *
 */

// TODO node.js doesn't always gracefully handle exceptions, so we may need
// TODO revisit how we expose invalid input errors

var service = require('./service'),
    Service = require('./service').Service,
    async = require('async'),
    _ = require('underscore');

/**
 * ServiceCatalog class
 *
 * @description wrapper for the service catalog response from keystone
 *
 * @param {String}  region      the default region to use for the service catalog
 * @param {object}  catalog     the raw data to parse into the catalog
 * @constructor
 */
var ServiceCatalog = function(region, catalog) {
    if (!region) {
        throw ('You must specify a region');
    }

    var self = this;

    self.region = region;
    self.services = {};

    _.each(catalog, function(service) {
        self.services[service.name] = new Service(self.region, service);
    });
};

/**
 * serviceCatalog.validateServiceCatalog
 *
 * @description Allow for asynchronous validation of the service catalog before
 * initializing via constructor. Allows for callbacks to return with err in lieu
 * of throwing Error() when provided with invalid inputs
 *
 * @param {String}      region      the default region for the catalog
 * @param {object}      catalog     the service catalog to parse
 * @param {Function}    callback
 */
exports.validateServiceCatalog = function(region, catalog, callback) {
    async.forEachSeries(catalog, function(svc, next) {
        service.validateRegionForService(svc, region, next);
    }, callback);
};

exports.ServiceCatalog = ServiceCatalog;
