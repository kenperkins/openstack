/*
 * openstack.js: Entry point for openstack package
 *
 * (C) 2013 Ken Perkins
 * MIT LICENSE
 *
 */

var openstack = module.exports;

// Expose version through `pkginfo`.
require('pkginfo')(module, 'version');

// Core functionality
openstack.createClient = require('./client').createClient;

openstack.core = require('./client');
openstack.identity = require('./identity');
openstack.Compute = require('./compute');