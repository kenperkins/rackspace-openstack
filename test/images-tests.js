var os = require('../lib/openstack');
var config = require('../config.json');
var should = require('should'),
    util = require('util');

describe('Images Tests', function() {

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

    it('Get Images', function(done) {
        client.getImages(function(err, images) {
            should.not.exist(err);
            should.exist(images);

            images.should.be.an.instanceof(Array);

            done();
        });
    });

    it('Get Image by id', function(done) {
        client.getImage('5cebb13a-f783-4f8c-8058-c4182c724ccd', function(err, image) {
            should.not.exist(err);
            should.exist(image);

            image.should.be.an.instanceof(os.Image);

            done();
        });
    });
});
