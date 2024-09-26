type LogLevel = 'Info' | 'Warning' | 'Error';

interface LogMessage {
  message: string;
  context?:string;
  data?: any;
  stack?: string;
  code?: string;
  statusCode?: number;
  correlationId?: string;
  details?: any[];
  type?: string;
  error?: Error
}

class Logger {
  private log(level: LogLevel, message: LogMessage): void {
    const timestamp = new Date().toISOString();
    const logOutput = this.formatLogMessage(level, message, timestamp);

    switch (level) {
      case 'Error':
        console.error(logOutput);
        break;
      case 'Warning':
        console.warn(logOutput);
        break;
      case 'Info':
      default:
        console.info(logOutput);
        break;
    }
  }

  private formatLogMessage(level: LogLevel, message: LogMessage, timestamp: string): string {
    const { type = 'Unknown', code, context, statusCode, correlationId, details, data, stack } = message;
    if(!message.message && !message.context) return  `${type} ${level} occurred at ${timestamp} ${JSON.stringify(message)}`;
    const outputLines: string[] = [
      `${type} ${level} at ${timestamp}`,
    ];
    if(context) outputLines.push(`Context: ${context} `)
    if(message.message && !stack) outputLines.push(`Message: ${message.message}`)
    if (stack) outputLines.push(`Stack: ${stack}`);
    if (code) outputLines.push(`Code: ${code}`);
    if (statusCode) outputLines.push(`StatusCode: ${statusCode}`);
    if (correlationId) outputLines.push(`Correlation ID: ${correlationId}`);
    if (details && details.length > 0) outputLines.push(`Details: ${JSON.stringify(details, null, 2)}`);
    if (data) outputLines.push(`Data: ${JSON.stringify(data, null, 2)}`);

    return outputLines.join('\n');
  }

  public info(message: LogMessage): void {
    this.log('Info', message);
  }

  public warn(message: LogMessage): void {
    this.log('Warning', message);
  }

  public error(message: LogMessage): void {
    this.log('Error', message);
  }
}

export const logger = new Logger();
