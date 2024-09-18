import { logger } from './logger';
import shutdown from './shutdown'

function isHubSpotApiError(error: any) {
  return Boolean(error?.message?.includes('hubapi'));
}
function isGeneralPrismaError(error: any): boolean {
  return error?.stack?.includes('@prisma/client') || error?.message?.includes('prisma');
}

function handleError(error: any, critical:boolean = false): void {
  if(critical){
    error.type = 'Critical'
    logger.error(error)
    shutdown()
    return;
  }
   if (isGeneralPrismaError(error)) {
    error.type = 'Prisma'
    logger.error(error)
  } else if (isHubSpotApiError(error)) {
    error.type = 'Hubspot API'
    logger.error(error)
  } else if (error instanceof Error) {
      logger.error(error);
  } else {
      error.type = 'Non-error object was thrown'
      logger.error(error)
  }
}

export default handleError
