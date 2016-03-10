'use strict';

var createLogger = require('../logger');

describe('Logger', function() {
  var testTime;
  var testServiceName = 'test-service-name';
  var testRelease = 'test-1.0';
  var consoleSpy = jasmine.createSpyObj(['log']);
  var sentrySpy = jasmine.createSpyObj(['captureException', 'captureMessage', 'patchGlobal']);
  var message = 'test message';
  var meta = {test: 'meta'};
  var expectedLogged;
  var log = createLogger(testServiceName, testRelease, null, {sentryClient: sentrySpy, consoleWriter: consoleSpy});

  beforeEach(function() {
    testTime = new Date();
    jasmine.clock().install();
    jasmine.clock().mockDate(testTime);
    expectedLogged = {
      timestamp: testTime.toISOString(),
      service_name: testServiceName,
      severity: 'operational',
      message: message
    };
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it('Operational log without meta information', function() {
    log(message);
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('Operational log with meta information', function() {
    log.log(message, meta);
    expectedLogged.meta = meta;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('Debug log', function() {
    log.debug(message);
    expectedLogged.severity = 'debug';
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('Error log', function() {
    var testError = new Error('test');
    log.error(message, meta, testError);
    expectedLogged.severity = 'error';
    expectedLogged.meta = meta;
    expectedLogged.error = {
      message: testError.message,
      stack: testError.stack
    };
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    expect(sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(testError);
  });

  it('Error log with string', function() {
    var testErrorStr = 'errorString';
    log.error(message, meta, testErrorStr);
    expectedLogged.severity = 'error';
    expectedLogged.meta = meta;
    expectedLogged.error = testErrorStr;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    expect(sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(new Error(testErrorStr));
  });

  it('Error log with object', function() {
    var testErrorObj = {errorCode: '101', errorMessage: 'the end'};
    log.error(message, meta, testErrorObj);
    expectedLogged.severity = 'error';
    expectedLogged.meta = meta;
    expectedLogged.error = testErrorObj;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    expect(sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(new Error(JSON.stringify(testErrorObj)));
  });

  it('Patches for uncaught errors', function() {
    log.handleUncaughtException();
    expect(sentrySpy.patchGlobal).toHaveBeenCalled();
  });

  it('Replace logger - deprecated', function() {
    var params;
    log.logger = { log() { params = [].slice.call(arguments); }};
    log('foo');
    expect(params).toEqual(['foo', undefined]);
  });
});
