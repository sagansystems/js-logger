'use strict';

var Logger = require('../logger');

describe('Logger', function() {
  var testTime;
  var testServiceName = 'test-service-name';
  var testRelease = 'test-1.0';
  var consoleSpy = jasmine.createSpyObj(['log']);
  var sentrySpy = jasmine.createSpyObj(['captureException', 'captureMessage', 'patchGlobal']);
  var message = 'test message';
  var meta = {test: 'meta'};
  var expectedLogged;
  var logger;

  beforeEach(function() {
    logger = new Logger(testServiceName, testRelease, null, {sentryClient: sentrySpy, consoleWriter: consoleSpy});
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

  it('operational logs without meta information', function() {
    logger.log(message);
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('operational logs with meta information', function() {
    logger.log(message, meta);
    expectedLogged.meta = meta;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('debug logs', function() {
    logger.debug(message);
    expectedLogged.severity = 'debug';
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it('error logs', function() {
    var testError = new Error('test');
    logger.error(message, meta, testError);
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

  it('error logs with string', function() {
    var testErrorStr = 'errorString';
    logger.error(message, meta, testErrorStr);
    expectedLogged.severity = 'error';
    expectedLogged.meta = meta;
    expectedLogged.error = testErrorStr;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    expect(sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(new Error(testErrorStr));
  });

  it('error logs with object', function() {
    var testErrorObj = {errorCode: '101', errorMessage: 'the end'};
    logger.error(message, meta, testErrorObj);
    expectedLogged.severity = 'error';
    expectedLogged.meta = meta;
    expectedLogged.error = testErrorObj;
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    expect(sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(new Error(JSON.stringify(testErrorObj)));
  });

  describe('handleUncaughtException', function() {
    const error = new Error('uncaught exeception');
    const sentrySent = true;

    beforeEach(function() {
      spyOn(process, 'exit');

      sentrySpy.patchGlobal.and.callFake((callback) => {
        callback(sentrySent, error);
      });

      spyOn(logger, 'error');

      logger.handleUncaughtException();
    });

    it('patches for uncaught errors', function() {
      expect(sentrySpy.patchGlobal).toHaveBeenCalled();
    });

    it('logs the error', function() {
      expect(logger.error).toHaveBeenCalledWith(
        'uncaught exception, exiting', { sentrySent }, error
      );
    });

    it('calls process.exit(1)', function() {
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  it('replaces logger', function() {
    var myConsoleSpy = jasmine.createSpyObj(['log']);
    logger.consoleWriter = myConsoleSpy;
    logger.log(message);
    var testLogMsgString = JSON.stringify(expectedLogged);

    expect(myConsoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
  });
});
