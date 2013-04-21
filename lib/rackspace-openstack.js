/*
 * rackspace.js: Wrapper for rackspace-openstack object
 *
 * (C) 2012 Ken Perkins
 * Inspired by node-cloudservers from Nodejitsu
 * MIT LICENSE
 *
 */

var rackspace = exports;

// Expose version through `pkginfo`.
require('pkginfo')(module, 'version');

// Core functionality
rackspace.createClient = require('./client/client').createClient;

// Type Definitions
rackspace.Client = require('./client/client').Client;

// Cloud Servers
rackspace.Server = require('./cloudservers/server').Server;
rackspace.Flavor = require('./cloudservers/flavor').Flavor;
rackspace.Image = require('./cloudservers/image').Image;
rackspace.Network = require('./cloudservers/network').Network;
rackspace.PublicNet = require('./cloudservers/network').PublicNet;
rackspace.ServiceNet = require('./cloudservers/network').ServiceNet;

// Cloud Dns
rackspace.Domain = require('./clouddns/domain').Domain;
rackspace.Record = require('./clouddns/record').Record;
rackspace.Status = require('./clouddns/status').Status;

// Cloud Block Storage
rackspace.Volume = require('./cloudblockstorage/volume').Volume;
rackspace.VolumeType = require('./cloudblockstorage/volume').VolumeType;

// Cloud LoadBalancers
rackspace.LoadBalancer = require('./cloudloadbalancers/loadbalancer').LoadBalancer;
rackspace.SessionPersistence = require('./cloudloadbalancers/loadbalancer').SessionPersistence;
rackspace.Algorithm = require('./cloudloadbalancers/loadbalancer').Algorithm;
rackspace.VirtualIp = require('./cloudloadbalancers/virtualip').VirtualIp;
rackspace.VirtualIpTypes = require('./cloudloadbalancers/virtualip').VirtualIpTypes;
rackspace.Protocols = require('./cloudloadbalancers/protocol').Protocols;
rackspace.Node = require('./cloudloadbalancers/node').Node;
rackspace.NodeConditions = require('./cloudloadbalancers/node').NodeConditions;
rackspace.NodeType = require('./cloudloadbalancers/node').NodeType;

// Cloud Databases
rackspace.DatabaseInstance = require('./clouddatabases/instance').DatabaseInstance;
rackspace.Database = require('./clouddatabases/database').Database;
rackspace.DatabaseUser = require('./clouddatabases/user').DatabaseUser;

rackspace.Endpoints = {
    Openstack: {
        type: 'compute',
        name: 'cloudServersOpenStack'
    },
    CloudDns: {
        type: 'rax:dns',
        name: 'cloudDNS'
    },
    CloudLoadBalancer: {
        type: 'rax:load-balancer',
        name: 'cloudLoadBalancers'
    },
    CloudBlockStorage: {
        type: 'volume',
        name: 'cloudBlockStorage'
    },
    CloudDatabases: {
        type: 'rax:database',
        name: 'cloudDatabases'
    }
};
