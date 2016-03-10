// logger
'use strict';

var raven = require("raven");

class Logger {
  constructor(serviceName, release, envTags, opts) {
    this.serviceName = serviceName;

    var opts = opts || {};
    this.consoleWriter = opts.consoleWriter
      || console;
    this.sentryClient = opts.sentryClient
      || this._createSentryClient(serviceName, release, envTags);
  }

  log(message, meta) {
    this._log('operational', message, meta);
  }

  debug(message, meta) {
    this._log('debug', message, meta);
  }

  error(message, meta, error) {
    this._log('error', message, meta, error);
    if (this.sentryClient) {
      if (error) {
        this.sentryClient.captureException(this._errorify(error), {extra: {meta, message}});
      } else {
        this.sentryClient.captureMessage(message, {extra: {meta}});
      }
    }
  };

  handleUncaughtException() {
    function uncaughtException(meta, err) {
      log.error('uncaught exception, exiting', meta, err);
      process.exit(1);
    }

    if (this.sentryClient) {
      this.sentryClient.patchGlobal((sentrySent, err) => {
        uncaughtException({sentrySent}, err);
      });
    } else {
      process.on('uncaughtException', (err) => {
        uncaughtException(null, err);
      });
    }
  }

  _log(severity, message, meta, error) {
    var currentTime = new Date();
    var logMsg = {
      timestamp: currentTime.toISOString(),
      service_name: this.serviceName,
      severity: severity,
      message: message,
      meta: meta
    };
    if (error) {
      logMsg.error = this._logify(error);
    }
    var logString = JSON.stringify(logMsg);
    this.consoleWriter.log(logString);
  }

  _errorify(err) {
    if (err instanceof Error) {
      return err;
    } else if (typeof err === 'string') {
      return new Error(err);
    } else {
      return new Error(JSON.stringify(err));
    }
  }

  _logify(err) {
    if (err instanceof Error) {
      return {message: err.message, stack: err.stack};
    }
    return err;
  }

  _createSentryClient(serviceName, release, envTags) {
    var sentryDSN = process.env.SENTRY_DSN;
    var client;
    if (sentryDSN) {
      client = new raven.Client(sentryDSN, {
        logger: serviceName,
        release: release
      });
      client.setTagsContext(envTags);
      this.log('logging errors to sentry', {envTags: envTags});
    } else {
      this.log('not logging errors to sentry');
    }
  }
}

function createLogger(serviceName, release, envTags, opts) {
  var logger = new Logger(serviceName, release, envTags, opts);

  var log = function(message, meta) {
    log.logger.log(message, meta);
  };
  log.logger = logger;
  log.log = function(message, meta) {
    this.logger.log(message, meta);
  };
  log.debug = function(message, meta) {
    this.logger.debug(message, meta);
  };
  log.error = function(message, meta, error) {
    this.logger.error(message, meta, error);
  };
  log.handleUncaughtException = function() {
    this.logger.handleUncaughtException();
  };
  return log;
}

module.exports = createLogger;
