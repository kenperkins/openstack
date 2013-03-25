/*
 * index.js: Identity models
 *
 * (C) 2013 Rackspace
 *      Ken Perkins
 * MIT LICENSE
 *
 */

module.exports = require('./identity');
exports.service = require('./service');
exports.Service = require('./service').Service;
exports.serviceCatalog = require('./serviceCatalog');
exports.ServiceCatalog = require('./serviceCatalog').ServiceCatalog;
