var os = require('../lib/openstack');
var config = require('../config.json');
var should = require('should');

describe('Authentication Tests', function() {

    it('Should fail because of missing credentials', function(done) {
        try {
            var client = os.createClient();
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'options.auth is required to create Config')
            done();
        }
    });

    it('Should connect and authenticate against Rackspace', function(done) {
        var client = os.createClient({
            auth: config.auth
        });

        client.authorize(function(err, config) {
            should.not.exist(err);
            should.exist(config);
            should.exist(config.token);

            done();
        });
    });

    it('Should fail connecting with invalid password', function(done) {
        var client = os.createClient({
            auth: {
                username: config.auth.username,
                apiKey: 'thisisnotreal'
            }
        });

        client.authorize(function(err, config) {
            should.exist(err);
            should.not.exist(config);

            done();
        });
    });
});
