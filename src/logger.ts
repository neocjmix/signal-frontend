enum LOG_LEVEL {
  DEBUG,
  INFO,
  WARNING,
  ERROR
}

let currentLogLevel = LOG_LEVEL.DEBUG

export const logger = (logLevel: LOG_LEVEL) => (...args: any[]) => {
  if(logLevel >= currentLogLevel){
    console.log(...args);
  }
}

export const log = {
  debug: logger(LOG_LEVEL.DEBUG),
  info: logger(LOG_LEVEL.INFO),
  warning: logger(LOG_LEVEL.WARNING),
  error: logger(LOG_LEVEL.ERROR),
}