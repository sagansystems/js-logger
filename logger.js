// logger
'use strict';

export class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  log(severity, message, meta) {
    var currentTime = new Date();
    var logMsg = {
      timestamp: currentTime.toISOString(),
      service_name: this.serviceName,
      severity: severity,
      message: message,
      meta: meta
    };
    var logString = JSON.stringify(logMsg);
    console.log(logString);
  }
}

export default function createLogger(serviceName) {
  var logger = new Logger(serviceName);

  function log(message, meta) {
    log.logger.log('operational', message, meta);
  }

  log.debug = function(message, meta) {
    log.logger.log('debug', message, meta);
  };

  log.error = function(message, meta) {
    log.logger.log('error', message, meta);
  };
  log.logger = logger;
  return log;
}
