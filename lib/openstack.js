/*
 * openstack.js: Entry point for openstack package
 *
 * (C) 2013 Ken Perkins
 * MIT LICENSE
 *
 */

var openstack = exports;

// Expose version through `pkginfo`.
require('pkginfo')(module, 'version');

// Core functionality
openstack.createClient = require('./client').client.createClient;

openstack.core = require('./client');
openstack.models = require('./models');
