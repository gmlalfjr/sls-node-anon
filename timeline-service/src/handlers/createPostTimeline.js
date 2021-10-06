import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';
import TimelineService from '../service/timelineService';

const timeline = new TimelineService();
const log = bunyan.createLogger({ name: 'timeline-services' });

const validateRequest = (event) => {
  const allowedBody = [
    'text',
    'type',
  ];
  // eslint-disable-next-line guard-for-in
  const Obs = Object.keys(event.body);
  for (let i = 0; i < allowedBody.length; i += 1) {
    const allow = Obs.includes(allowedBody[i]);
    if (!allow) {
      return errorResponse('Is invalid body request', 400);
    }
  }

  const allowedType = ['ALL', 'CURHAT'];
  const checkValueTypes = allowedType.includes(event.body.type);
  if (!checkValueTypes) {
    return errorResponse(`Not Allowed ${event.body.type} as types`);
  }
  return null;
};

async function createTimeline(event) {
  const validate = validateRequest(event);
  if (validate !== null) {
    return validate;
  }
  const { username } = event.requestContext.authorizer;
  const { text, type } = event.body;

  try {
    const res = await timeline.createTimeline({ username, text, type });
    return successResponse('Successful Post Timeline', 200, res);
  } catch (error) {
    log.error(`[Error] Post timeline -  ${error.message}`);
    return errorResponse(error.message, error.statusCode || 500);
  }
}

export const handler = middy(createTimeline);
