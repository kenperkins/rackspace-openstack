/*
 * openstack.js: Wrapper for rackspace-openstack object
 *
 * (C) 2012 Clipboard, Inc.
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var openstack = exports;

// Expose version through `pkginfo`.
require('pkginfo')(module, 'version');

// Core functionality
openstack.createClient = require('./openstack/core').createClient;

// Type Definitions
openstack.Client = require('./openstack/core').Client;
openstack.Server = require('./openstack/server').Server;
openstack.Flavor = require('./openstack/flavor').Flavor;
openstack.Image = require('./openstack/image').Image;