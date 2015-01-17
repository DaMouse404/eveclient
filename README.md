# Eve Client

[![Build Status](https://travis-ci.org/DaMouse404/eveclient.svg?branch=master)](https://travis-ci.org/DaMouse404/eveclient)
[![Coverage Status](https://coveralls.io/repos/DaMouse404/eveclient/badge.svg?branch=master)](https://coveralls.io/r/DaMouse404/eveclient?branch=master)
[![Code Climate](https://codeclimate.com/github/DaMouse404/eveclient/badges/gpa.svg)](https://codeclimate.com/github/DaMouse404/eveclient)

Client for the Eve API with cache provided by [Cacheman](https://www.npmjs.org/package/cacheman)

## Example
```js
var Client = require('./lib/client'),
    client = new Client({
        key: '123456',
        code: 'yellowsubmarineyellowsubmarine'
    });

client.fetch('account', 'AccountStatus', {}, function(err, result) {
    console.log(err, result);
});
```

## API

### Client
#### new Client(options)
```js
var options = {
  key: '1234', // Eve Key ID
  code: 'yellowsubmarine', // Eve Verification Code
  cache: null // (Optional Cacheman configuration, defaults to memory cache)
};

var client = new Client(options);
```
See [Cacheman](https://www.npmjs.com/package/cacheman) for cache details

#### Client#fetch(resource, endpoint, params, callback)
```js
client.fetch('server', 'ServerStatus', {}, function(err, result) {
  console.log(err, result);
});
```
