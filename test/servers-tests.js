//

var openstack = require('../lib/openstack'),
    should = require('should'),
    nock = require('nock'),
    config = null,
    mock = false;

try {
    config = require('../config.json');
    console.log('Using user defined config');
}
catch (e) {
    mock = true;
    console.log('Using mock api endpoint');
}

describe('ComputeClient Tests', function() {

    var client;

    before(function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: '75c70aecb0584759a26e122a2b94aed7',
            tenantId: '4480c6f7325340e4a12945d14b7cb852',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', {
                    auth: {
                        token: {
                            id: cfg.token
                        },
                        tenantId: cfg.tenantId
                    }
                })
                .replyWithFile(200, __dirname + '/mock/identity/200-RegionOne-identity-response.json');
        }

        openstack.createClient(cfg, function(err, c) {
            should.not.exist(err);
            should.exist(c);

            client = c;
            done();
        });
    });


    it('Should be able to get servers', function(done) {
        if (mock) {
            nock('http://166.78.241.239:8774')
                .get('/v2/4480c6f7325340e4a12945d14b7cb852/servers/detail')
                .replyWithFile(200, __dirname + '/mock/servers/200-get-servers-detail.json');
        }

        client.compute.getServers(function(err, servers) {
            should.not.exist(err);
            should.exist(servers);
            servers.length.should.equal(2);

            done();
        });
    });

    it('Shouldn\'t error when getting servers returns no servers', function(done) {
        if (mock) {
            nock('http://166.78.241.239:8774')
                .get('/v2/4480c6f7325340e4a12945d14b7cb852/servers/detail')
                .replyWithFile(200, __dirname + '/mock/servers/200-get-servers-detail-no-servers.json');
        }

        client.compute.getServers(function(err, servers) {
            should.not.exist(err);
            should.exist(servers);
            servers.length.should.equal(0);

            done();
        });
    });
});