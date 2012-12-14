var os = require('../lib/rackspace-openstack');
var config = require('../config.json');
var should = require('should'),
    util = require('util');

describe('Servers tests', function() {

    var client;

    before(function(done) {
        client = os.createClient({
            auth: config.auth
        });

        client.authorize(function(err, config) {
            should.not.exist(err);
            should.exist(config);

            done();
        });
    });

    it('get servers', function(done) {
        client.getServers(function(err, servers) {
            should.not.exist(err);
            should.exist(servers);

            //console.log(util.inspect(servers, false, null));
            done();
        });
    });

//    it('create a server', function(done) {
//        client.createServer({
//            image: '5cebb13a-f783-4f8c-8058-c4182c724ccd',
//            flavor: 2,
//            name: 'test-from-mocha'
//        }, function(err, server) {
//            should.not.exist(err);
//            should.exist(server);
//
//            server.setWait({ status: 'ACTIVE' }, 5000, function() {
//                console.dir(server);
//                done();
//            });
//        });
//    });
});
