var casperRequire = patchRequire(require);
var clientutils = casperRequire('clientutils');
var fs = require('fs');

/**
 * Download a file in the PhantomJS browser context instead of using the built-in
 * CasperJS .download() method.
 * @param  {object}    opts                 Options required for download to execute.
 * @param  {object}    opts.casper          Currently running CasperJS instance.
 * @param  {string}    opts.url             Url of file to download.
 * @param  {string}    opts.targetFilepath  Local path to map the downloaded file to.
 * @param  {string}    opts.method          Request method to use
 * @param  {string}    opts.data            Form data for POST requests
 * @param  {number}    [opts.waitTimeout]   Optional. Time in milliseconds before download times out.
 * @param  {function}  [opts.onComplete]    Optional. Called when file finished downloading.
 * @param  {function}  [opts.onError]       Optional. Called if an error occurs while downloading.
 * @return {void}
 */
module.exports = function(opts) {

	opts = opts || {};

	var casper = opts.casper;
	var url = opts.url;
	var targetFilepath = opts.targetFilepath;
	var method = opts.method || 'GET';
	var data = opts.data;
	var onComplete = opts.onComplete;
	var onError = opts.onError;
	var waitTimeout = opts.waitTimeout || (60000 * 5);

	// Ensure all required properties were provided
	if(casper === undefined) {
		throw 'CasperJS instance must be provided to download a file.';
	}

	if(url === undefined) {
		throw 'Url of resource to download must be provided.';
	}

	if(targetFilepath === undefined) {
		if(!onComplete || typeof onComplete !== 'function') {
			throw 'Target file path or onComplete callback must be provided.';
		}
	}


	// Create request to download file
	casper.thenEvaluate(function(url, method, data) {

		// Create an object to track the download's progress
		window[url] = {
			xhr: new XMLHttpRequest(),
			transferComplete: false,
			error: false
		};

		var xhr = window[url].xhr;

		// File loaded completely
		xhr.onload = function () {
			window[url].transferComplete = true;
		};

		// Error occured
		xhr.onerror = function() {
			window[url].error = true;
		};

		xhr.open(method, url, true);
		xhr.responseType = 'arraybuffer';

		if(method === 'POST') {
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.send(data);
		} else {
			xhr.send(null);
		}
	}, url, method, data);



	casper.waitFor(

		function check() {
			return this.evaluate(function(url) {
				return window[url].transferComplete || window[url].error;
			}, url);
		},

		function then() {

			// Check for any non-timeout errors during download
			var xhrData =
				this.evaluate(function(url) {
					return {
						error: window[url].error,
						statusText: window[url].xhr.statusText,
						statusCode: window[url].xhr.status
					};
				}, url);

			if(xhrData.error) {
				if(onError && typeof onError === 'function') {
					onError({
						message: 'Download failed: see error data for more information.',
						data: {
							url: url,
							statusText: xhrData.statusText,
							statusCode: xhrData.statusCode
						}
					});
				}
				return;
			}


			// Write file to hard drive
			var base64encoded =
				this.evaluate(function(url) {
					return window.btoa([].reduce.call(
						new Uint8Array(window[url].xhr.response),
						function(p, c) {
							return p + String.fromCharCode(c);
						},
						''));
				}, url);

			var cu = clientutils.create();

			var fileContents = cu.decode(base64encoded);

			if(targetFilepath) {
				fs.write(targetFilepath, fileContents, 'wb');
			}

			if(onComplete && typeof onComplete === 'function') {
				onComplete(fileContents);
			}
		},

		function timeout(){
			if(onError && typeof onError === 'function') {
				onError({
					message: 'Timed out while attempting to download file.',
					data: {
						url: url
					}
				});
			}
		},

		waitTimeout);
};
