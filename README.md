# js-logger

Structured logging for Javascript

## Usage
```js
var log = createLogger("your-service-name");
log.handleUncaughtException();
```

Operational logging:

```log('message', optional-meta);```

Debug logging:

```log.debug('message', optional-meta);```

Error logging:

```log.error('message', optional-meta, error);```

If raven is configured the error will be sent to sentry

Silencing the logger:

```log.logger = { log() {} };```
