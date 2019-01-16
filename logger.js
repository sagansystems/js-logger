// logger
'use strict';

var raven = require('raven');

const logLevel = {
  ALL: 0,
  DEBUG: 1,
  OPERATIONAL: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5,
  properties: {
    1: {name: "debug", value: 1},
    2: {name: "operational", value: 2},
    3: {name: "warn", value: 3},
    4: {name: "error", value: 4},
    5: {name: "critical", value: 5},
  }
};

class Logger {
  constructor(serviceName, release, envTags, opts) {
    this.serviceName = serviceName;

    opts = opts || {};

    let defaultConsoleWriter = {
      log(msg) {
        process.stdout.write(msg, 'utf8');
        process.stdout.write('\n');
      },
    };
    this.consoleWriter = opts.consoleWriter || defaultConsoleWriter;
    this.sentryClient = opts.sentryClient || this._createSentryClient(serviceName, release, envTags);
    this.logLevel = opts.logLevel || logLevel.ALL;

    this.logMessages = [];
    this.isAsync = false;
    if (opts.intervalMs) {
      this.isAsync = true;
      setInterval(() => this.flush(), opts.intervalMs);
    }
  }

  log(message, meta) {
    this._log(logLevel.OPERATIONAL, message, meta);
  }

  debug(message, meta) {
    this._log(logLevel.DEBUG, message, meta);
  }

  error(message, meta, error) {
    this._logWithSentry(logLevel.ERROR, message, meta, error);
  }

  critical(message, meta, error) {
    this._logWithSentry(logLevel.CRITICAL, message, meta, error);
  }

  handleUncaughtException() {
    var uncaughtException = (meta, err) => {
      this.error('uncaught exception, exiting', meta, err);
      this.flush();
      process.exit(1);
    };

    if (this.sentryClient) {
      this.sentryClient.patchGlobal((sentrySent, err) => {
        uncaughtException({ sentrySent }, err);
      });
    } else {
      process.on('uncaughtException', err => {
        uncaughtException(null, err);
      });
    }
  }

  _log(severity, message, meta, error) {
    if (severity.value < this.logLevel.value) {
      return
    }

    var currentTime = new Date();
    var logMsg = {
      timestamp: currentTime.toISOString(),
      service_name: this.serviceName,
      severity: severity,
      message: message,
      meta: meta,
    };
    if (error) {
      logMsg.error = this._logify(error);
    }

    if (this.isAsync) {
      this.logMessages.push(logMsg);
    } else {
      this._writeMessage(logMsg);
    }
  }

  _logWithSentry(severity, message, meta, error) {
    this._log(severity, message, meta, error);
    if (this.sentryClient) {
      if (error) {
        this.sentryClient.captureException(this._errorify(error), { extra: { meta, message } });
      } else {
        this.sentryClient.captureMessage(message, { extra: { meta } });
      }
    }
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
      return { message: err.message, stack: err.stack };
    }
    return err;
  }

  _createSentryClient(serviceName, release, envTags) {
    var sentryDSN = process.env.SENTRY_DSN;
    var client;
    if (sentryDSN) {
      client = new raven.Client(sentryDSN, {
        logger: serviceName,
        release: release,
      });
      client.setTagsContext(envTags);
      this.log('logging errors to sentry', { envTags: envTags });
    } else {
      this.log('not logging errors to sentry');
    }
    return client;
  }

  _writeMessage(msg) {
    var logString = JSON.stringify(msg);
    this.consoleWriter.log(logString);
  }

  flush() {
    this.logMessages.forEach(msg => this._writeMessage(msg));
    this.logMessages = [];
  }
}

module.exports = Logger;
