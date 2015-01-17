var expat = require('node-expat'),
    _ = require('lodash');

/**
 * Parses an EVE API response from either an XML string or a readable stream.
 * A callback will be invoked and passed either an error or result object.
 *
 * @param  {String|Stream} xml API response
 * @param  {Function}      cb  Result callback
 */
module.exports.parse = function (xml, cb) {
  var parser = new expat.Parser('UTF-8'),
      result = {},
      current = result,
      parents = [],
      currentTag,
      keys;

  // When we end the stream it gets ended multiple times ;_;
  cb = _.once(cb);

  parser.on('error', function (err) {
    cb(new Error(err));

    this.end();
  });

  parser.on('end', function () {
    var err = null,
        res;

    if (result && result.eveapi && result.eveapi.error) {
      err = new Error(result.eveapi.error);
      err.code = result.eveapi.errorCode;
    } else if (!result || !result.eveapi || !result.eveapi.result) {
      err = new Error('Invalid API response structure.');
    } else {
      if (result.eveapi.currentTime)
        result.eveapi.result.currentTime = result.eveapi.currentTime;
      if (result.eveapi.cachedUntil)
        result.eveapi.result.cachedUntil = result.eveapi.cachedUntil;

      res = result.eveapi.result;
    }

    cb(err, res);
  });

  parser.on('startElement', function (q, r) {
    var tag = {
        name: q,
        attributes: r
    };

    currentTag = tag;
    tag.alias = tag.name;
    tag.result = current;
    parents.push(tag);

    if (tag.name === 'row') {
      var key = keys.map(function (key) { return tag.attributes[key]; }).join(':');
      current[key] = {};
      current = current[key];

      for (var attr in tag.attributes) {
        current[attr] = tag.attributes[attr];
      }
    } else {
      if (tag.name === 'rowset') {
        keys = tag.attributes.key.split(',');
        tag.alias = tag.attributes.name;
      } else if (tag.name === 'error') {
        current.errorCode = tag.attributes.code ? tag.attributes.code : null;
      }

      current[tag.alias] = {};
      current = current[tag.alias];
    }
  });

  parser.on('endElement', function () {
    current = parents.pop().result;
    var parentTag = parents[parents.length - 1];

    if (parentTag && parentTag.name === 'rowset') {
      keys = parentTag.attributes.key.split(',');
    }
  });

  parser.on('text', function (text) {
    if (text.trim() === '') {
        return;
    }

    parents[parents.length - 1].result[currentTag.name] = text;
  });

  if (xml.pipe) {
    xml.pipe(parser);
  } else {
    parser.write(xml);
    parser.end();
  }
};

