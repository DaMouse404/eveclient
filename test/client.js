var Sinon = require('sinon'),
    Request = require('request'),
    FS = require('fs'),
    Client = require('../lib/client'),
    assert = require('assert');

describe('Client', function() {
    describe('Fetcher', function() {
        var client;

        beforeEach(function() {
            client = new Client({ key: '1234', code: '2341abcdef' });
            Sinon.stub(client._cache, 'get').yields();
            Sinon.stub(client._cache, 'set').yields();
            Sinon.stub(Request, 'get').returns(FS.createReadStream(__dirname + '/fixtures/ServerStatus.xml'));
        });

        afterEach(function() {
            client._cache.get.restore();
            client._cache.set.restore();
            Request.get.restore();
        });

        it('requests the correct URL for the endpoint with id and key added', function(done) {
            client.fetch('char', 'CharacterSheet', {}, function() {
                assert(Request.get.calledWith({
                    url: 'https://api.eveonline.com/char/CharacterSheet.xml.aspx',
                    qs: {
                        keyID: '1234',
                        vCode: '2341abcdef'
                    }
                }));
                done();
            });
        });

        it('merges the URL params into the request', function(done) {
            client.fetch('char', 'CharacterSheet', { cake: 'bake' }, function() {
                assert(Request.get.calledWith({
                    url: 'https://api.eveonline.com/char/CharacterSheet.xml.aspx',
                    qs: {
                        keyID: '1234',
                        vCode: '2341abcdef',
                        cake: 'bake'
                    }
                }));
                done();
            });
        });

        it('Does not use the apiKey and ID when not required', function(done) {
            client.fetch('server', 'ServerStatus', {}, function() {
                assert(Request.get.calledWith({
                    url: 'https://api.eveonline.com/server/ServerStatus.xml.aspx',
                    qs: {}
                }));
                done();
            });
        });

        it('respects the TTLs given by the Eve api', function(done) {
            client.fetch('server', 'ServerStatus', {}, function() {
                assert.equal(1, client._cache.set.getCall(0).args[2]);
                done();
            });
        });

        it('Bubbles parser errors', function(done) {
            Request.get.returns(FS.createReadStream(__dirname + '/fixtures/garbage.xml'));

            client.fetch('server', 'ServerStatus', {}, function(err) {
                assert.equal('syntax error', err.message);
                done();
            });
        });

        it('Stores the parsed form of the response', function(done) {
            client.fetch('server', 'ServerStatus', {}, function() {
                assert.deepEqual(require('./fixtures/ServerStatus'), client._cache.set.getCall(0).args[1]);
                done();
            });
        });
    });

    describe('Cached response', function() {
        var client;

        beforeEach(function() {
            client = new Client({ key: '1234', code: '2341abcdef' });
            Sinon.stub(Request, 'get').returns(FS.createReadStream(__dirname + '/fixtures/ServerStatus.xml'));
        });

        afterEach(function() {
            Request.get.restore();
        });

        it('Combines the request resource, endpoint and parameters for the cache key', function(done) {
            Sinon.stub(client._cache, 'get').yields();
            Sinon.stub(client._cache, 'set').yields();

            client.fetch('space', 'SHIP', { cake: 'bake' }, function() {
                var key = 'space:SHIP:1234:2341abcdef:58225a3b0a5331d39b4bf58cb39d169b';

                assert(client._cache.get.calledWith(key));
                assert(client._cache.set.calledWith(key));
                done();
            });
        });

        it('returns a cached response if one is available', function(done) {
            Sinon.stub(client._cache, 'get').yields(null, { cake: 'bake' });

            client.fetch('space', 'SHIP', {}, function(err, result) {
                assert(!Request.called);
                assert.deepEqual({ cake: 'bake' }, result);
                client._cache.get.restore();
                done();
            });
        });

        it('Propagates cache errors through to the client', function(done) {
            Sinon.stub(client._cache, 'get').yields(new Error('cake'));

            client.fetch('space', 'SHIP', {}, function(err) {
                assert(!Request.get.called);
                assert.equal('cake', err.message);
                client._cache.get.restore();
                done();
            });
        });
    });

    describe('Validation', function() {
        it('errors on bad input arguments', function() {
            assert.throws(
                function() {
                    new Client({
                        cake: 'bake'
                    });
                },
                /ValidationError/
            );

            assert.throws(
                function() {
                    new Client({
                        cache: {
                            engine: 'goblinsridingsharksfiringlasers'
                        },
                        key: 'validishstring',
                        code: 'validishstring'
                    });
                },
                /ValidationError/
            );
        });
    });
});
