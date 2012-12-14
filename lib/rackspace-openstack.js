/*
 * rackspace.js: Wrapper for rackspace-openstack object
 *
 * (C) 2012 Clipboard, Inc.
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var rackspace = exports;

// Expose version through `pkginfo`.
require('pkginfo')(module, 'version');

// Core functionality
rackspace.createClient = require('./core').createClient;

// Type Definitions
rackspace.Client = require('./core').Client;

// Cloud Servers
rackspace.Server = require('./cloudservers/server').Server;
rackspace.Flavor = require('./cloudservers/flavor').Flavor;
rackspace.Image = require('./cloudservers/image').Image;

// Cloud Dns
rackspace.Domain = require('./clouddns/domain').Domain;
rackspace.Record = require('./clouddns/record').Record;