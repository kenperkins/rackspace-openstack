var os = require('../lib/openstack');
var config = require('../config.json');
var should = require('should'),
    util = require('util');

describe('Flavors Tests', function() {

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

    it('Get Flavors', function(done) {
        client.getFlavors(function(err, flavors) {
            should.not.exist(err);
            should.exist(flavors);

            flavors.should.be.an.instanceof(Array);

            done();
        });
    });

    it('Get Flavor by id', function(done) {
        client.getFlavor(2, function(err, flavor) {
            should.not.exist(err);
            should.exist(flavor);

            flavor.should.be.an.instanceof(os.Flavor);

            done();
        });
    });
});
