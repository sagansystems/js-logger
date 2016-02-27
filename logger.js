// logger
'use strict';

var raven = require("raven");

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  log(severity, message, meta, error) {
    var currentTime = new Date();
    var logMsg = {
      timestamp: currentTime.toISOString(),
      service_name: this.serviceName,
      severity: severity,
      message: message,
      meta: meta,
    };
    if (error) {
      if (error instanceof Error ) {
        logMsg.error = {message: error.message, stack: error.stack};
      } else {
        logMsg.error = error;
      }
    }
    var logString = JSON.stringify(logMsg);
    console.log(logString);
  }
}

function createLogger(serviceName) {
  var logger = new Logger(serviceName);
  var client;
  var sentryDSN = process.env.SENTRY_DSN;

  function log(message, meta) {
    log.logger.log('operational', message, meta);
  }

  log.debug = function(message, meta) {
    log.logger.log('debug', message, meta);
  };

  log.error = function(message, meta, error) {
    log.logger.log('error', message, meta, error);
    if (client) {
      if (error) {
        client.captureException(error, {extra: {meta, message}});
      } else {
        client.captureMessage(message, {extra: {meta}});
      }
    }
  };

  function uncaughtException(meta, err) {
    log.error('uncaught exception, exiting', meta, err);
    process.exit(1);
  }

  log.handleUncaughtException = function() {
    if (client) {
      client.patchGlobal((sentrySent, err) => {
        uncaughtException({sentrySent}, err);
      });
    } else {
      process.on('uncaughtException', (err) => {
        uncaughtException(null, err);
      });
    }
  };
  log.logger = logger;

  if (sentryDSN) {
    client = new raven.Client(sentryDSN, {logger: serviceName});
    log('logging errors to sentry');
  } else {
    log('not logging errors to sentry');
  }

 return log;
}

module.exports = createLogger;
