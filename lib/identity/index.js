/*
 * index.js: Identity models
 *
 * (C) 2013 Rackspace
 *      Ken Perkins
 * MIT LICENSE
 *
 */

module.exports = require('./identity');
module.exports.service = require('./service');
module.exports.serviceCatalog = require('./serviceCatalog');
module.exports.Service = module.exports.service.Service;
module.exports.ServiceCatalog = module.exports.serviceCatalog.ServiceCatalog;
