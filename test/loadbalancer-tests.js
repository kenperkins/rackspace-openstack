var os = require('../lib/rackspace-openstack');
var config = require('../config.json');
var should = require('should'),
    util = require('util');

describe('Load Balancer tests', function() {

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

    it('Create with missing inputs', function(done) {
        client.createLoadBalancer({}, function(err, loadBalancer) {
            should.exist(err);
            should.not.exist(loadBalancer);

            err.requiredParametersMissing.length.should.equal(5);

            done();
        });
    });
});
