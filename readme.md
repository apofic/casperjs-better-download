# casperjs-better-download

Download a file in the PhantomJS browser context instead of using the built-in CasperJS `.download()` method. This library uses an async ajax request to circumvent download timeout issues.

Note: despite technically being an async call, this library will block CasperJS step execution.


### Why

Many people are having issues with incorrectly downloaded files in CasperJS, resulting in 0kb downloads. This library uses an alternative method of downloading to avoid this issue.

### Documentation

##### Basic use:

```javascript
var casper = require('casper').create({});
var betterDownload = require('casperjs-better-download');

betterDownload({
	casper: casper,
	url: 'https://example.com/file.pdf',
	targetFilepath: 'data/file.pdf'
});
```

##### Using POST:

```javascript
var casper = require('casper').create({});
var betterDownload = require('casperjs-better-download');

betterDownload({
	casper: casper,
	url: 'https://example.com/file.pdf',
	targetFilepath: 'data/file.pdf',
	method: 'POST',
	data: 'var1=value&var2=value2'
});
```

##### Callbacks (optional):

```javascript
betterDownload({
	...
	onComplete: function(fileContent) {
		casper.then(function() {
			// Do something after file downloads
		});
	},
	onError: function(err) {
	    console.log(err.message);
	    console.log('Error data:', JSON.stringify(err.data));
	}
});
```

##### Timeout (optional):

The default timeout is set to 5 minutes, but you can set it to whatever you want by passing in a timeout value in milliseconds.

```javascript
var tenMins = 60000 * 10;

betterDownload({
	...
	waitTimeout: tenMins
});
```

### Credit

This library is just a slight refactoring of [laggingreflex](https://github.com/laggingreflex)'s suggestion [here](https://github.com/casperjs/casperjs/issues/1342#issue-116656821).
