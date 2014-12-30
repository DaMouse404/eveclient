var sax = require('sax');

/**
 * Parses an EVE API response from either an XML string or a readable stream.
 * A callback will be invoked and passed either an error or result object.
 *
 * @param  {String|Stream} xml API response
 * @param  {Function}      cb  Result callback
 */
module.exports.parse = function (xml, cb) {
  var parser = sax.createStream(true, {trim: true})
    , result = {}
    , current = result
    , parents = []
    , currentTag
    , keys

  parser.on('error', function (err) {
    cb(err)
  })

  parser.on('end', function () {
    var err = null
      , res = undefined

    if (result && result.eveapi && result.eveapi.error) {
      err = new Error(result.eveapi.error)
      err.code = result.eveapi.errorCode
    } else if (!result || !result.eveapi || !result.eveapi.result) {
      err = new Error('Invalid API response structure.')
    } else {
      if (result.eveapi.currentTime) result.eveapi.result.currentTime = result.eveapi.currentTime
      if (result.eveapi.cachedUntil) result.eveapi.result.cachedUntil = result.eveapi.cachedUntil
      res = result.eveapi.result
    }

    cb(err, res)
  })

  parser.on('opentag', function (tag) {
    currentTag = tag
    tag.alias = tag.name
    tag.result = current
    parents.push(tag)

    if (tag.name === 'row') {
      var key = keys.map(function (key) { return tag.attributes[key] }).join(':')
      current[key] = {}
      current = current[key]

      for (var attr in tag.attributes) {
        current[attr] = tag.attributes[attr]
      }
    } else {
      if (tag.name === 'rowset') {
        keys = tag.attributes.key.split(',')
        tag.alias = tag.attributes.name
      } else if (tag.name === 'error') {
        current.errorCode = tag.attributes.code ? tag.attributes.code : null
      }

      current[tag.alias] = {}
      current = current[tag.alias]
    }
  })

  parser.on('closetag', function (tagName) {
    current = parents.pop().result
    var parentTag = parents[parents.length - 1]

    if (parentTag && parentTag.name === 'rowset') {
      keys = parentTag.attributes.key.split(',')
    }
  })

  parser.on('text', function (text) {
    parents[parents.length - 1].result[currentTag.name] = text
  })

  if (xml.pipe) {
    xml.pipe(parser)
  } else {
    parser.write(xml)
    parser.end()
  }
}

