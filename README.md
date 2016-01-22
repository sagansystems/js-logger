# js-logger

Structured logging for Javascript

## Usage
```var log = createLogger("your-service-name");```

Operational logging:

```log('message', optional-meta);```

Debug logging:

```log.debug('message', optional-meta);```

Error logging:

```log.error('message', optional-meta);```

Silencing the logger:

```log.logger = { log() {} };```
