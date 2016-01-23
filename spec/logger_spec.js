'use strict';

var createLogger = require('../logger');

describe('Logger', function() {
  var testTime;
  var testServiceName = 'test-service-name';
  var message = 'test message';
  var log = createLogger(testServiceName);

  beforeEach(function() {
    testTime = new Date();
    jasmine.clock().install();
    jasmine.clock().mockDate(testTime);
    spyOn(console, 'log');
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it ('Operational log without meta information', function() {
    log(message);

    var testLogMsg = {
      timestamp: testTime.toISOString(),
      service_name: testServiceName,
      severity: 'operational',
      message: message
    };

    var testLogMsgString = JSON.stringify(testLogMsg);

    expect(console.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it ('Operational log with meta information', function() {
    var testMeta = {test: 'meta'};
    log(message, testMeta);

    var testLogMsg = {
      timestamp: testTime.toISOString(),
      service_name: testServiceName,
      severity: 'operational',
      message: message,
      meta: testMeta
    };
    var testLogMsgString = JSON.stringify(testLogMsg);

    expect(console.log).toHaveBeenCalledWith(testLogMsgString);
  });
  it('Replace logger', function() {
    var params;
    log.logger = { log() { params = [].slice.call(arguments); }}
    log('foo')
    expect(params).toEqual(['operational', 'foo', undefined]);
  });
});
