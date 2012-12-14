var os = require('../lib/rackspace-openstack');
var config = require('../config.json');
var should = require('should'),
    util = require('util'),
    _ = require('underscore');

describe('Domains Tests', function() {

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

    it('Get Domain and update details', function(done) {
        client.getDomains(function(err, domains) {
            should.not.exist(err);
            should.exist(domains);

            domains.should.be.an.instanceof(Array);

            var domain = domains[0];

            domain.should.be.an.instanceof(os.Domain);

            domain.getDetails(function(err) {
                should.not.exist(err);
                done();
            });
        });
    });

    it('Get Records for a Domain', function(done) {
        client.getDomains(function(err, domains) {
            should.not.exist(err);
            should.exist(domains);

            domains.should.be.an.instanceof(Array);

            var domain = domains[0];

            domain.should.be.an.instanceof(os.Domain);

            domain.getRecords(function(err, records) {
                should.not.exist(err);
                should.exist(records);

                records.should.be.an.instanceof(Array);
                done();
            });
        });
    });
});
