Eve Client
##########

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
