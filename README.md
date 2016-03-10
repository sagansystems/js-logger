# js-logger

Structured logging for Javascript

## Usage
```js
var logger = new Logger("your-service-name", "your-release-version", {envTags: forSentry});
logger.handleUncaughtException();
```

Operational logging:

```logger.log('message', optional-meta);```

Debug logging:

```logger.debug('message', optional-meta);```

Error logging:

```logger.error('message', optional-meta, error);```

If raven is configured the error will be sent to sentry

Silencing the logger:

```logger.consoleWriter = { log: function() {} };```

Replacing underlying loggers with spys for testing:

```js
var testLogger = new Logger("service", "release", {envTags: forTest}, {consoleWriter: consoleSpy, sentryClient: sentrySpy});
```
