//

var identity = require('../lib/client/identity'),
    services = require('../lib/client/services').services,
    should = require('should'),
    nock = require('nock'),
    _ = require('underscore'),
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


describe('Authentication Tests', function() {

    it('Should fail because of no inputs', function(done) {
        try {
            identity.authorize(null, function(err, response) {

            });
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'Authentication Endpoint is a required detail')
            done();
        }
    });

    it('Should fail because of invalid inputs', function(done) {
        try {
            identity.authorize({}, function(err, response) {

            });
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'Authentication Endpoint is a required detail')
            done();
        }
    });

    it('Should fail because of missing password with username', function(done) {
        try {
            identity.authorize({
                url: 'http://166.78.241.239:5000/v2.0/tokens',
                username: 'foo'
            }, function(err, response) {

            });
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'Must provide (password and username) or (token and tenant)')
            done();
        }
    });

    it('Should fail because of missing tenant with a token', function(done) {
        try {
            identity.authorize({
                url: 'http://166.78.241.239:5000/v2.0/tokens',
                token: 'foo'
            }, function(err, response) {

            });
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'Must provide (password and username) or (token and tenant)')
            done();
        }
    });

    it('Should fail because of missing username with password', function(done) {
        try {
            identity.authorize({
                url: 'http://166.78.241.239:5000/v2.0/tokens',
                password: 'foo'
            }, function(err, response) {

            });
        }
        catch (e) {
            should.exist(e);
            e.should.be.an.instanceof(Error);
            e.should.have.property('message', 'Must provide (password and username) or (token and tenant)')
            done();
        }
    });

    it('Should connect and authenticate with password & username', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            username: 'thisismyusername',
            password: 'asdf1234',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', { auth: {
                    'passwordCredentials': {
                        username: cfg.username,
                        password: cfg.password
                    }
                }})
                .replyWithFile(200, __dirname + '/mock/identity/200-RegionOne-identity-response.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.token);
            should.exist(auth.serviceCatalog);

            done();
        });
    });

    it('Should fail to authenticate with bad password & username', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            password: 'asdf1234',
            username: 'thisismyusername',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', { auth: {
                    'passwordCredentials': {
                        username: cfg.username,
                        password: cfg.password
                    }
                }})
                .replyWithFile(401, __dirname + '/mock/identity/401-invalid-passwordCredentials.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.exist(err);
            should.not.exist(auth);
            err.error.message.should.equal('Invalid user / password');

            done();
        });
    });

    it('Should fail to authenticate with password & username & bad tenant', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            password: 'asdf1234',
            username: 'thisismyusername',
            tenantName: 'asdf12#$',
            region: 'ORD'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', { auth: {
                    'passwordCredentials': {
                        username: cfg.username,
                        password: cfg.password
                    },
                    tenantName: cfg.tenantName
                }})
                .replyWithFile(401, __dirname + '/mock/identity/401-invalid-tenantName.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.exist(err);
            should.not.exist(auth);
            err.error.code.should.equal(401);
            err.error.message.should.equal('The request you have made requires authentication.');

            done();
        });
    });

    it('Should connect and authenticate with token and tenantId', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: 'asdf1234',
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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.token);
            should.exist(auth.serviceCatalog);
            auth.token.tenant.id.should.equal(cfg.tenantId);

            done();
        });
    });

    it('Should connect and authenticate with token and tenantName', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: 'asdf1234',
            tenantName: 'demo',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', {
                    auth: {
                        token: {
                            id: cfg.token
                        },
                        tenantName: cfg.tenantName
                    }
                })
                .replyWithFile(200, __dirname + '/mock/identity/200-RegionOne-identity-response.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.token);
            should.exist(auth.serviceCatalog);
            auth.token.tenant.name.should.equal(cfg.tenantName);

            done();
        });
    });

    it('Should fail to connect and authenticate with token and bad tenantName', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: 'asdf1234',
            tenantName: 'demox',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', {
                    auth: {
                        token: {
                            id: cfg.token
                        },
                        tenantName: cfg.tenantName
                    }
                })
                .replyWithFile(404, __dirname + '/mock/identity/404-invalid-tenantName-with-token.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.exist(err);
            err.error.code.should.equal(404);
            should.not.exist(auth);

            done();
        });
    });

    it('Should fail to connect and authenticate with token and bad tenantId', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: 'asdf1234',
            tenantId: 'demox',
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
                .replyWithFile(401, __dirname + '/mock/identity/401-invalid-tenantName.json');
        }

        identity.authorize(cfg, function(err, auth) {

            should.exist(err);
            err.error.code.should.equal(401);
            should.not.exist(auth);

            done();
        });
    });

    it('Token expires should be a date object', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            password: 'asdf1234',
            username: 'thisismyusername',
            region: 'RegionOne'
        };

        if (mock) {
            nock('http://166.78.241.239:5000')
                .post('/v2.0/tokens', { auth: {
                    'passwordCredentials': {
                        username: cfg.username,
                        password: cfg.password
                    }
                }})
                .replyWithFile(200, __dirname + '/mock/identity/200-RegionOne-identity-response.json');
        }

        identity.authorize(cfg, function(err, identity) {

            should.not.exist(err);
            should.exist(identity);
            should.exist(identity.token);
            identity.token.expires.should.be.instanceof(Date);

            done();
        });
    });

    it('Endpoints should match requested region or be region-agnostic', function(done) {

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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.token);
            should.exist(auth.serviceCatalog);

            _.each(auth.serviceCatalog.services, function(service) {
                if (service.selectedEndpoint.region) {
                    service.selectedEndpoint.region.toLowerCase().should.equal(cfg.region.toLowerCase());
                }
            });

            done();
        });
    });

    it('Should fail to match endpoint region for ec2', function(done) {

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
                .replyWithFile(200, __dirname + '/mock/identity/missingRegionEndpoint.json');
        }

        identity.authorize(cfg, function(err, auth) {
            should.exist(err);
            err.message.should.equal('Unable to identify target endpoint for Service');
            err.serviceName.should.equal(services.ec2);

            should.not.exist(auth);

            done();
        });

    });

    it('Should fail when default region is not specified', function(done) {

        var cfg = config ? config : {
            url: 'http://166.78.241.239:5000/v2.0/tokens',
            token: '75c70aecb0584759a26e122a2b94aed7',
            tenantId: '4480c6f7325340e4a12945d14b7cb852'
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

        identity.authorize(cfg, function(err, auth) {

            should.exist(err);
            err.message.should.equal('Unable to identify target endpoint for Service');
            should.not.exist(auth);

            done();
        });
    });

    it('Get the correct endpoint url for a service', function(done) {

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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.serviceCatalog.services[services.nova]);

            auth.serviceCatalog.services[services.nova].getEndpointUrl().should.equal('http://166.78.241.239:8774/v2/4480c6f7325340e4a12945d14b7cb852');

            done();
        });
    });

    it('Get the publicURL for an endpoint, even when asking for a private (when no private exists)', function(done) {

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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.serviceCatalog.services[services.s3]);

            auth.serviceCatalog.services[services.s3].getEndpointUrl({ internal: true }).should.equal('http://166.78.241.239:3333');

            done();
        });
    });

    it('Get the internalURL for an endpoint, when asking for internal', function(done) {

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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.serviceCatalog.services[services.nova]);

            auth.serviceCatalog.services[services.nova].getEndpointUrl({ internal: true }).should.equal('http://166.78.241.239:8775/v2/4480c6f7325340e4a12945d14b7cb852');

            done();
        });
    });

    it('Get an alternate region for an endpoint', function(done) {

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

        identity.authorize(cfg, function(err, auth) {

            should.not.exist(err);
            should.exist(auth);
            should.exist(auth.serviceCatalog.services[services.nova]);

            auth.serviceCatalog.services[services.nova].getEndpointUrl({ region: 'RegionTwo' }).should.equal('http://166.78.241.239:9774/v2/4480c6f7325340e4a12945d14b7cb852');

            done();
        });
    });
});