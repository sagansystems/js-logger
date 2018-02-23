'use strict';

var Logger = require('../logger');

describe('Logger', function() {
  const testServiceName = 'test-service-name';
  const message = 'test message';
  const testRelease = 'test-1.0';
  const meta = { test: 'meta' };

  beforeEach(function() {
    let testTime = new Date();
    jasmine.clock().install();
    jasmine.clock().mockDate(testTime);
    this.expectedLogged = {
      timestamp: testTime.toISOString(),
      service_name: testServiceName,
      severity: 'operational',
      message: message,
    };
    this.consoleSpy = jasmine.createSpyObj(['log']);
    this.sentrySpy = jasmine.createSpyObj(['captureException', 'captureMessage', 'patchGlobal']);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('synchronous logging', function() {
    beforeEach(function() {
      this.subject = new Logger(testServiceName, testRelease, null, {
        sentryClient: this.sentrySpy,
        consoleWriter: this.consoleSpy,
      });
    });

    it('uses synchronous logging', function() {
      expect(this.subject.isAsync).toBe(false);
    });

    it('operational logs without meta information', function() {
      this.subject.log(message);
      var testLogMsgString = JSON.stringify(this.expectedLogged);

      expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    });

    it('operational logs with meta information', function() {
      this.subject.log(message, meta);
      this.expectedLogged.meta = meta;
      var testLogMsgString = JSON.stringify(this.expectedLogged);

      expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    });

    it('debug logs', function() {
      this.subject.debug(message);
      this.expectedLogged.severity = 'debug';
      var testLogMsgString = JSON.stringify(this.expectedLogged);

      expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    });

    itHandlesLogsWithSentry('error');
    itHandlesLogsWithSentry('critical');

    function itHandlesLogsWithSentry(severity) {
      it(`${severity} logs`, function() {
        var testError = new Error('test');
        this.subject[severity](message, meta, testError);
        this.expectedLogged.severity = severity;
        this.expectedLogged.meta = meta;
        this.expectedLogged.error = {
          message: testError.message,
          stack: testError.stack,
        };
        var testLogMsgString = JSON.stringify(this.expectedLogged);

        expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
        expect(this.sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(testError);
      });

      it(`${severity} logs with string`, function() {
        var testErrorStr = 'errorString';
        this.subject[severity](message, meta, testErrorStr);
        this.expectedLogged.severity = severity;
        this.expectedLogged.meta = meta;
        this.expectedLogged.error = testErrorStr;
        var testLogMsgString = JSON.stringify(this.expectedLogged);

        expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
        expect(this.sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(new Error(testErrorStr));
      });

      it(`${severity} logs with object`, function() {
        var testErrorObj = { errorCode: '101', errorMessage: 'the end' };
        this.subject[severity](message, meta, testErrorObj);
        this.expectedLogged.severity = severity;
        this.expectedLogged.meta = meta;
        this.expectedLogged.error = testErrorObj;
        var testLogMsgString = JSON.stringify(this.expectedLogged);

        expect(this.consoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
        expect(this.sentrySpy.captureException.calls.mostRecent().args[0]).toEqual(
          new Error(JSON.stringify(testErrorObj))
        );
      });
    }
  });

  describe('asynchronous logging', function() {
    beforeEach(function() {
      this.subject = new Logger(testServiceName, testRelease, null, {
        sentryClient: this.sentrySpy,
        consoleWriter: this.consoleSpy,
        intervalMs: 1000,
      });

      this.subject.log(message);
    });

    it('uses asynchronous logging', function() {
      expect(this.subject.isAsync).toBe(true);
    });

    it('caches log message when log is called', function() {
      expect(this.subject.consoleWriter.log).not.toHaveBeenCalled();
      expect(this.subject.logMessages.length).toEqual(1);
    });

    it('writes log messages when time interval is reached', function() {
      let testLogMsgString = JSON.stringify(this.expectedLogged);
      jasmine.clock().tick(1001);
      expect(this.subject.consoleWriter.log).toHaveBeenCalledWith(testLogMsgString);
      expect(this.subject.logMessages.length).toEqual(0);
    });
  });

  describe('handleUncaughtException', function() {
    const error = new Error('uncaught exeception');
    const sentrySent = true;

    beforeEach(function() {
      this.subject = new Logger(testServiceName, testRelease, null, {
        sentryClient: this.sentrySpy,
        consoleWriter: this.consoleSpy,
      });

      spyOn(process, 'exit');

      this.sentrySpy.patchGlobal.and.callFake(callback => {
        callback(sentrySent, error);
      });

      spyOn(this.subject, 'error');
      spyOn(this.subject, 'flush');

      this.subject.handleUncaughtException();
    });

    it('patches for uncaught errors', function() {
      expect(this.sentrySpy.patchGlobal).toHaveBeenCalled();
    });

    it('logs the error', function() {
      expect(this.subject.error).toHaveBeenCalledWith('uncaught exception, exiting', { sentrySent }, error);
    });

    it('flushes messages', function() {
      expect(this.subject.flush).toHaveBeenCalled();
    });

    it('calls process.exit(1)', function() {
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('replace logger', function() {
    beforeEach(function() {
      this.subject = new Logger(testServiceName, testRelease, null, {
        sentryClient: this.sentrySpy,
        consoleWriter: this.consoleSpy,
      });
    });

    it('logs to new logger', function() {
      var myConsoleSpy = jasmine.createSpyObj(['log']);
      this.subject.consoleWriter = myConsoleSpy;
      this.subject.log(message);
      var testLogMsgString = JSON.stringify(this.expectedLogged);

      expect(myConsoleSpy.log).toHaveBeenCalledWith(testLogMsgString);
    });
  });
});
