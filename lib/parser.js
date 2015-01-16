var sax = require('sax');

/**
 * Copyright (c) 2012 Matt Harris

 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Parses an EVE API response from either an XML string or a readable stream.
 * A callback will be invoked and passed either an error or result object.
 *
 * @param  {String|Stream} xml API response
 * @param  {Function}      cb  Result callback
 */
module.exports.parse = function (xml, cb) {
  var parser = sax.createStream(true, {trim: true}),
      result = {},
      current = result,
      parents = [],
      currentTag,
      keys;

  parser.on('error', function (err) {
    cb(err);
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

  parser.on('opentag', function (tag) {
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

  parser.on('closetag', function () {
    current = parents.pop().result;
    var parentTag = parents[parents.length - 1];

    if (parentTag && parentTag.name === 'rowset') {
      keys = parentTag.attributes.key.split(',');
    }
  });

  parser.on('text', function (text) {
    parents[parents.length - 1].result[currentTag.name] = text;
  });

  if (xml.pipe) {
    xml.pipe(parser);
  } else {
    parser.write(xml);
    parser.end();
  }
};

