var Sinon = require('sinon'),
    Request = require('request'),
    Stream = require('stream'),
    FS = require('fs');
    Client  = require('../lib/client'),
    assert = require('assert');

//request
//    .get('https://api.eveonline.com/server/ServerStatus.xml.aspx')
//    .pipe(parser.parse);

describe('Fetch', function() {
    var client;

    beforeEach(function() {
        client = new Client({ id: '1234', key: '2341abcdef' });
        Sinon.stub(client._cache, 'get').yields();
        Sinon.stub(client._cache, 'set').yields();
    });

    it('Should request the correct URL for the endpoint', function(done) {
        var stream = FS.createReadStream(__dirname + '/fixtures/ServerStatus.xml');
        Sinon.stub(Request, 'get').returns(stream);

        client.fetch('server', 'ServerStatus', {}, function() {
            assert(Request.get.calledWith('https://api.eveonline.com/server/ServerStatus.xml.aspx'));
            done();
        });
    });
});
/*
parser.parse(
    request.get('https://api.eveonline.com/server/ServerStatus.xml.aspx'),
    function(err, result) {
        console.log(err, result);
    }
);
*/
