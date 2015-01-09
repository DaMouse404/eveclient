var Joi = require('joi'),
    Cacheman = require('cacheman'),
    Request = require('request'),
    _ = require('lodash'),
    Hash = require('object-hash'),
    Parser = require('./parser'),
    eveDomain = 'https://api.eveonline.com',
    openResources = ['eve', 'map', 'server'],
    clientSchema = Joi.object().keys({
        cache: Joi.object().keys({
            ttl: Joi.number(),
            engine: Joi.string().allow(Cacheman.engines).required(),
            prefix: Joi.string().alphanum(),
            port: Joi.number(),
            host: Joi.string().hostname()
        }),
        key: Joi.number().required(),
        code: Joi.string().alphanum().required()
    });

function requiresApiKey(resource) {
    return _.indexOf(openResources, resource) === -1;
}

function Client(options) {
    var validation = Joi.validate(options, clientSchema);

    if (validation.error) {
        throw new Error(validation.error);
    }

    this._keyParams = {
        keyID: options.key,
        vCode: options.code
    };

    this._cache = new Cacheman('EveClient', options.cache);
}

Client.prototype.fetch = function(resource, endpoint, params, cb) {
    var client = this,
        key = client._hash(resource, endpoint, params);

    client._cache.get(key, function(err, result) {
        if (err) {
            cb(err);
        } else if (!result) {
            client._fetch(resource, endpoint, params, cb);
        } else {
            cb(err, result);
        }
    });
};

Client.prototype._fetch = function(resource, endpoint, params, cb) {
    var client = this,
        requestArgs = {
            url: [eveDomain, '/', resource, '/',  endpoint, '.xml.aspx'].join('')
        };

    if (requiresApiKey(resource)) {
        requestArgs.qs = _.extend({}, this._keyParams, params);
    } else {
        requestArgs.qs = params;
    }

    Parser.parse(Request.get(requestArgs), function(err, result) {
        if (err) {
            return cb(err);
        }

        var ttl = Math.round((new Date(result.cachedUntil) - new Date(result.currentTime)) / 1000),
            key = client._hash(resource, endpoint, params);

        client._cache.set(key, result, ttl, function(err) {
            cb(err, result);
        });
    });
};

Client.prototype._hash = function(resource, endpoint, params) {
    params = _.omit(params, _.keys(this._keyParams));

    var key = resource + ':' + endpoint + ':';

    if (requiresApiKey(resource)) {
        key += _.values(this._keyParams).join(':') + ':';
    }

    key += Hash.MD5(params);

    return key;
};

module.exports=Client;
