var Joi = require('joi'),
    Cacheman = require('cacheman'),
    Request = require('request'),
    Parser = require('./parser'),
    eveDomain = 'https://api.eveonline.com',
    clientSchema = Joi.object().keys({
        cache: Joi.object().keys({
            ttl: Joi.number(),
            engine: Joi.string().allow(Cacheman.engines).required(),
            prefix: Joi.string().alphanum(),
            port: Joi.number(),
            host: Joi.string().hostname()
        }),
        id: Joi.number().required(),
        key: Joi.string().alphanum().required()
    });



function Client(options) {
    var validation = Joi.validate(options, clientSchema);

    if (validation.error) {
        throw new Error(validation.error);
    }

    this._id = options.id;
    this._key = options.key;

    this._cache = new Cacheman('EveClient', options.cache);
}

Client.prototype.fetch = function(resource, endpoint, params, cb) {
    var url = [eveDomain, '/', resource, '/',  endpoint, '.xml.aspx'].join(''),
        client = this;

    client._cache.get(url, function(err, result) {
        if (err) {
            cb(err);
        } else if (!result) {
            client._fetch(url, cb);
        } else {
            cb(err, result);
        }
    });
};

Client.prototype._fetch = function(url, cb) {
    var client = this;

    Parser.parse(Request.get(url), function(err, result) {
        var ttl = (new Date(result.currentTime) - new Date(result.cachedUntil));

        client._cache.set(url, result, ttl, function(err) {
            cb(err, result);
        });
    });
};

module.exports=Client;
