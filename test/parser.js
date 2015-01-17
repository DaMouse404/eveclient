var assert = require('assert'),
    fs = require('fs'),
    Parser = require('../lib/parser');

describe('Parser', function() {

    it('#parse() can parse simple API response', function (done) {
      fs.readFile(__dirname + '/fixtures/parser/simple.xml', function (err, xml) {
        fs.readFile(__dirname + '/fixtures/parser/simple.json', function (err, json) {
          Parser.parse(xml, function (err, result) {
            assert.ifError(err);
            assert.deepEqual(result, JSON.parse(json));
            done();
          });
        });
      });
    });

    it('#parse() can parse rowsets', function (done) {
      fs.readFile(__dirname + '/fixtures/parser/rowset.xml', function (err, xml) {
        fs.readFile(__dirname + '/fixtures/parser/rowset.json', function (err, json) {
          Parser.parse(xml, function (err, result) {
            assert.ifError(err);
            assert.deepEqual(result, JSON.parse(json));
            done();
          });
        });
      });
    });

    it('#parse() can parse nested rowsets', function (done) {
      fs.readFile(__dirname + '/fixtures/parser/alliance-list.xml', function (err, xml) {
        fs.readFile(__dirname + '/fixtures/parser/alliance-list.json', function (err, json) {
          Parser.parse(xml, function (err, result) {
            assert.ifError(err);
            assert.deepEqual(result, JSON.parse(json));
            done();
          });
        });
      });
    });

    it('#parse() can parse mutli-keyed rowsets', function (done) {
      fs.readFile(__dirname + '/fixtures/parser/multi-key.xml', function (err, xml) {
        fs.readFile(__dirname + '/fixtures/parser/multi-key.json', function (err, json) {
          Parser.parse(xml, function (err, result) {
            assert.ifError(err);
            assert.deepEqual(result, JSON.parse(json));
            done();
          });
        });
      });
    });

    it('#parse() can parse error response', function (done){
      fs.readFile(__dirname + '/fixtures/parser/error.xml', function (err, xml) {
        Parser.parse(xml, function (err) {
          assert.ok(err instanceof Error);
          assert.equal(err.message, 'Must provide userID or keyID parameter for authentication.');
          assert.equal(err.code, 106);
          done();
        });
      });
    });

    it('bubbles errors to the callback', function (done){
      fs.readFile(__dirname + '/fixtures/garbage.xml', function (err, xml) {
        Parser.parse(xml, function (err) {
          assert.ok(err instanceof Error);
          assert.equal('syntax error', err.message);
          done();
        });
      });
    });


    it('Errors if non eve API format is returned', function (done){
      fs.readFile(__dirname + '/fixtures/parser/noteve.xml', function (err, xml) {
        Parser.parse(xml, function (err) {
          assert.ok(err instanceof Error);
          assert.equal('Invalid API response structure.', err.message);
          done();
        });
      });
    });
    it('Allows read streams as well as raw xml', function(done) {
        Parser.parse(fs.createReadStream(__dirname + '/fixtures/parser/simple.xml'), function(err, json) {
            var expected = require(__dirname + '/fixtures/parser/simple');

            assert.deepEqual(expected, json);
            done();
        });
    });

});
