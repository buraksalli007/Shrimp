type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

function formatEntry(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data }),
  };
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, data?: Record<string, unknown>): void {
    console.log(formatEntry("info", message, data));
  },
  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(formatEntry("warn", message, data));
  },
  error(message: string, data?: Record<string, unknown>): void {
    console.error(formatEntry("error", message, data));
  },
  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatEntry("debug", message, data));
    }
  },
};
