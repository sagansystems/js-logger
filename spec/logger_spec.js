import createLogger from '../logger';

describe('Logger', function() {
  var testTime;
  var testServiceName = "test-service-name";
  var message = 'test message';
  var log = createLogger(testServiceName);

  beforeEach(function() {
    testTime = new Date();
    jasmine.clock().mockDate(testTime);
  });

  it ('Operational log without meta information', function() {
    spyOn(console, 'log');
    log(message);

    var testLogMsg = {
      'timestamp': testTime.toISOString(),
      'service_name': testServiceName,
      'severity': 'operational',
      'message': message
    };

    var testLogMsgString = JSON.stringify(testLogMsg);

    expect(console.log).toHaveBeenCalledWith(testLogMsgString);
  });

  it ('Operational log with meta information', function() {
    var testMeta = {"test": "meta"};
    spyOn(console, 'log'); 
    log(message, testMeta);

    var testLogMsg = {
      'timestamp': testTime.toISOString(),
      'service_name': testServiceName,
      'severity': 'operational',
      'message': message,
      'meta': testMeta
    };
    var testLogMsgString = JSON.stringify(testLogMsg);

    expect(console.log).toHaveBeenCalledWith(testLogMsgString);
  });
});
