// logger
'use strict';

const Sentry = require('@sentry/node');

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

    this.logMessages = [];
    this.isAsync = false;
    if (opts.intervalMs) {
      this.isAsync = true;
      setInterval(() => this.flush(), opts.intervalMs);
    }
  }

  log(message, meta) {
    this._log('operational', message, meta);
  }

  debug(message, meta) {
    this._log('debug', message, meta);
  }

  error(message, meta, error) {
    this._logWithSentry('error', message, meta, error);
  }

  critical(message, meta, error) {
    this._logWithSentry('critical', message, meta, error);
  }

  _log(severity, message, meta, error) {
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
    if (sentryDSN) {
      Sentry.init({
        dsn: sentryDSN,
        release: release,
        logger: serviceName,
        tags: envTags,
      });
      this.log('logging errors to sentry', { envTags: envTags });
    } else {
      this.log('not logging errors to sentry');
    }
    return Sentry;
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
