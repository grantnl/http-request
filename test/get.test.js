'use strict';

/*global describe: true, it: true, before: true, after: true*/

var client = require('../');
var common = require('./common.js');

var u = require('url');
var assert = require('chai').assert;

describe('HTTP GET method tests', function () {
	var server, secureServer;
	
	before(function (done) {
		var servers = common.createServers(done);
		server = servers.server;
		secureServer = servers.secureServer;
	});
	
	describe('GET Hello World Buffer - plain', function () {
		it('should pass "Hello World" buffer', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/',
				noCompress: true
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.code, 200, 'the status is success');
				assert.typeOf(res.headers, 'object', 'there is a headers object');
				assert.isUndefined(res.headers['content-encoding'], 'the content must not be encoded');
				assert.instanceOf(res.buffer, Buffer, 'the buffer is an instance of Buffer');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we  got back the proper string');
				
				done();
			});
		});
	});
	
	describe('GET Hello World Buffer - gzip', function () {
		it('should pass "Hello World" buffer', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/',
				headers: {
					'accept-encoding': 'gzip'
				}
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.headers['content-encoding'], 'gzip', 'the content is encoded with gzip');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we  got back the proper string');
				
				done();
			});
		});
	});
	
	describe('GET Hello World Buffer - deflate', function () {
		it('should pass "Hello World" buffer', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/',
				headers: {
					'accept-encoding': 'deflate'
				}
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.headers['content-encoding'], 'deflate', 'the content is encoded with deflate');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we  got back the proper string');
				
				done();
			});
		});
	});
	
	describe('GET Basic Authentication', function () {
		it('should pass back the basic authentication', function (done) {
			var url = u.format({
				protocol: 'http:',
				hostname: '127.0.0.1',
				port: common.options.port,
				pathname: '/basic-auth',
				auth: 'user@example.com:pass word'
			});
			
			client.get(url, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				var auth = JSON.parse(res.buffer.toString());
				var urlAuth = u.parse(url).auth.split(/:/);
				
				assert.strictEqual(auth.username, urlAuth[0]);
				assert.strictEqual(auth.password, urlAuth[1]);
				
				done();
			});
		});
	});
	
	describe('GET broken DNS name over HTTP', function () {
		it('should fail with an error passed back to the completion callback', function (done) {
			client.get('http://.foo.bar/', function (err, res) {
				assert.instanceOf(err, Error, 'the error is an Error instance');
				assert.strictEqual(err.url, 'http://.foo.bar/');
				
				done();
			});
		});
	});
	
	describe('GET broken DNS name over HTTPS', function () {
		it('should fail with an error passed back to the completion callback', function (done) {
			client.get('https://.foo.bar/', function (err, res) {
				assert.instanceOf(err, Error, 'the error is an Error instance');
				assert.strictEqual(err.url, 'https://.foo.bar/');
				
				done();
			});
		});
	});
	
	describe('GET DNS error', function () {
		it('should fail with an error passed back to the completion callback', function (done) {
			client.get('http://foo.bar/', function (err, res) {
				assert.instanceOf(err, Error, 'the error is an Error instance');
				assert.strictEqual(err.code, 'ENOTFOUND');
				assert.strictEqual(err.url, 'http://foo.bar/');
				
				done();
			});
		});
	});
	
	describe('GET header reflect', function () {
		it('should pass back the header foo sent from the client', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/header-reflect',
				headers: {
					foo: 'bar'
				}
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.headers.foo, 'bar', 'we got the foo header back');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we got the proper response body');
				
				done();
			});
		});
	});
	
	describe('GET with invalid maxBody', function () {
		it('should throw an Error', function (done) {
			var throws = function () {
				client.get({
					url: 'http://127.0.0.1:' + common.options.port + '/',
					maxBody: 'foo'
				}, function (err, res) {
					
				});
			};
			
			assert.throws(throws, Error, 'Invalid options.maxBody specification. Expecting a proper integer value.');
			
			done();
		});
	});
	
	describe('GET with invalid progress', function () {
		it('should throw an Error', function (done) {
			var throws = function () {
				client.get({
					url: 'http://127.0.0.1:' + common.options.port + '/',
					progress: 'foo'
				}, function (err, res) {
					
				});
			};
			
			assert.throws(throws, Error, 'Expecting a function as progress callback.');
			
			done();
		});
	});
	
	describe('GET without protocol prefix', function () {
		it('should work fine by prepending http:// to the URL', function (done) {
			client.get('127.0.0.1:' + common.options.port + '/', function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.code, 200, 'the HTTP status code is OK');
				assert.strictEqual(res.headers['content-type'], 'text/plain', 'we got the proper MIME type');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we got the proper buffer');
				
				done();
			});
		});
	});
	
	describe('GET ranged content', function () {
		it('should return just part of the content', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/',
				headers: {
					range: 'bytes=0-5'
				},
				noCompress: true
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.code, 206, 'we have the proper status code');
				assert.isDefined(res.headers['content-length'], 'we have a Content-Lenght');
				assert.strictEqual(res.headers['content-range'], '0-5/11', 'we have the proper value for the Content-Range response header');
				
				assert.strictEqual(res.buffer.toString(), 'Hello', 'we have the proper partial content');
				
				done();
			});
		});
	});
	
	describe('GET with redirect', function () {
		it('should redirect succesfully', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/redirect',
				noCompress: true
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.code, 200, 'we got the proper HTTP status code');
				assert.strictEqual(res.url, 'http://127.0.0.1:' + common.options.port + '/', 'we got the proper URL back');
				
				done();
			});
		});
	});
	
	describe('GET with progress callback', function () {
		it('should call the progress callback', function (done) {
			client.get({
				url: 'http://127.0.0.1:' + common.options.port + '/',
				progress: function (current, total) {
					// there's a single data event
					// the Hello World is compressed with gzip
					// but larger than the payload
					
					assert.strictEqual(current, 31);
					assert.strictEqual(total, 31);
				}
			}, function (err, res) {
				assert.isNull(err, 'we have an error');
				
				assert.strictEqual(res.code, 200, 'we got the proper HTTP status code');
				assert.strictEqual(res.headers['content-type'], 'text/plain', 'we got the proper MIME type');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we got back the proper buffer');
				
				done();
			});
		});
	});
	
	describe('GET over HTTPS with SSL validation', function () {
		it('should verify succesfully the connection', function (done) {
			client.get({
				url: 'https://127.0.0.1:' + common.options.securePort + '/',
				headers: {
					host: 'http-get.lan'
				},
				ca: [require('./ca.js')]
			}, function (err, res) {
				assert.isNull(err);
				
				assert.strictEqual(res.code, 200, 'we got the proper HTTP status code');
				assert.strictEqual(res.headers['content-type'], 'text/plain', 'we got the proper MIME type');
				assert.strictEqual(res.buffer.toString(), 'Hello World', 'we got back the proper buffer');
				
				done();
			});
		});
	});
	
	after(function () {
		server.close();
		secureServer.close();
	});
});
