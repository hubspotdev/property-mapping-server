import { logger } from "./logger";
import shutdown from "./shutdown";
import { LogObject } from "../types/common";

function isHubSpotApiError(error: unknown): boolean {
  // Check for presence of typical HubSpot headers
  const hasHubspotHeaders =
    typeof (error as any).headers === 'object' &&
    ("x-hubspot-correlation-id" in (error as any).headers ||
      "x-hubspot-ratelimit-max" in (error as any).headers);

  // Check for presence of HubSpot-specific fields in the error body
  const hasHubspotFields =
    typeof (error as any).body === 'object' &&
    (error as any).body?.status === "error" &&
    typeof (error as any).body?.correlationId === "string" &&
    typeof (error as any).body?.groupsErrorCode === "string";

  return (
    hasHubspotHeaders ||
    hasHubspotFields ||
    Boolean(
      (error as any)?.message?.includes("hubapi") ||
        (error as any)?.logMessage?.message?.body?.includes("hubspot-correlation-id"),
    )
  );
}

function isGeneralPrismaError(error: unknown): boolean {
  const errorObj = error as { stack?: string; message?: string };
  return Boolean(
    errorObj.stack?.includes("@prisma/client") ||
    errorObj.message?.includes("prisma")
  );
}

function formatError(logMessage: any, context: string = "") {
  const error: LogObject = { logMessage, context };
  if (!error.type) {
    if (isGeneralPrismaError(logMessage)) {
      error.type = "Prisma";
    } else if (isHubSpotApiError(logMessage)) {
      error.type = "Hubspot API";
    } else if (logMessage instanceof Error) {
      error.type = "General";
    } else {
      error.type = "Non-error object was thrown";
    }
  }
  return error;
}

function handleError(
  error: unknown,
  context: string = "",
  critical: boolean = false,
): void {
  const formattedError = formatError(error, context);
  logger.error(formattedError);

  if (critical) shutdown();
}

export default handleError;
