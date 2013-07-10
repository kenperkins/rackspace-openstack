# rackspace-openstack

A client implementation for the Rackspace Openstack API (v2)

## THIS PACKAGE IS NOW DEPRECATED ##

All functionality in this package is either implemented in [pkgcloud](https://github.com/nodejitsu/pkgcloud) or is in the process of being migrated to pkgcloud. Please only use this package for prototyping at this point as the next published version will remove functionality entirely.

## Usage

The rackspace-openstack module is compliant with the [Rackspace Openstack API][0]. rackspace-openstack
is a nearly feature complete wrapper for the Rackspace Openstack APIs and should work in most scenarios.

## Supported APIs

Currently, the following feature areas are supported:

- Open Stack CloudServers
- CloudDNS
- CloudLoadBalancers

### Getting Started
Creating and authenticating your client against the Rackspace API is simple:

```Javascript
var rackspace = require('rackspace-openstack'),
    config = {
        auth : {
            username: 'your-username',
            apiKey: 'your-api-key'
    }
};

var client = rackspace.createClient(config);

client.authorize(function(err) {
    if (err) {
        process.exit(1);
        return;
    }

    // Do stuff here
}
```

### Creating a Server
```Javascript
client.createServer({
    image: '5cebb13a-f783-4f8c-8058-c4182c724ccd',
    flavor: 2,
    name: 'My Server'
}, function(err, server) {

    // Do stuff with your new server
    
});

```

### Getting a domain and creating a record
```Javascript
var myDomainId = 1234567;

client.getDomain(myDomainId, function(err, domain) {
    domain.addRecordsWithWait([
        {
            name: 'foo.' + domain.name,
            type: 'A',
            data: '1.2.3.4'
        }
    ], function(err, records) {

        // use your new records here
    });
});

```

### Create a cloud load balancer
```Javascript
client.createLoadBalancer({
    name: 'My Load Balancer',
    nodes: [ {
        address: '192.168.1.1',
        port: '80',
        condition: rackspace.NodeConditions.ENABLED
    } ],
    protocol: rackspace.Protocols.HTTP,
    virtualIps: [{
        type: rackspace.VirtualIpTypes.PUBLIC
    }]
}, function(err, loadBalancer) {
    // Use your new Load Balancer here
});

```

### Create and attach a Cloud BlockStorage Volume
```Javascript
client.getServer(serverId, function(err, server) {
    client.createVolume({
        display_name: 'my new volume ' + serverId,
        size: 100,
        volume_type: rackspace.VolumeType.SATA
    }, function(err, volume) {
        server.attachVolume({
            volumeId: volume.id,
            device: '/dev/xvdb'
        }, function(err, result) {
            // Use your Volume Here
        });
    });
});
```

## Run Tests
All rackspace-openstack tests are available by running `make test`

## Credit
Much of the shape of this library was courtesy of [Charlie Robbins][1] and the team at Nodejitsu for [node-cloudservers][2]
#### Author: [Ken Perkins](http://github.com/kenperkins)

[0]: http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ch_preface.html
[1]: http://github.com/indexzero
[2]: https://github.com/nodejitsu/node-cloudservers
