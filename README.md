# rackspace-openstack

A client implementation for the Rackspace Openstack API (v2)

## Usage

The rackspace-openstack module is compliant with the [Rackspace Openstack API][0]. rackspace-openstack
is a nearly feature complete wrapper for the Rackspace Openstack APIs and should work in most scenarios.

### Getting Started
Creating and authenticating your client against the Rackspace API is simple:

```Javascript
var openstack = require('openstack'),
    config = {
        auth : {
            username: 'your-username',
            apiKey: 'your-api-key'
    }
};

var client = openstack.createClient(config);

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

## Run Tests
All rackspace-openstack tests are available by running `make test`

## Credit
Much of the shape of this library was courtesy of [Charlie Robbins][1] and the team at Nodejitsu for [node-cloudservers][2]
#### Author: [Ken Perkins](http://github.com/kenperkins)

[0]: http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ch_preface.html
[1]: http://github.com/indexzero
[2]: https://github.com/nodejitsu/node-cloudservers
