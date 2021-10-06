/* eslint-disable import/prefer-default-export */
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';
import TimelineService from '../service/timelineService';

const timeline = new TimelineService();
const log = bunyan.createLogger({ name: 'timeline-services' });

async function deletePost(event) {
  const { id } = event.pathParameters;
  const { username } = event.requestContext.authorizer;

  try {
    await timeline.deleteTimeline(id, username);
  } catch (error) {
    log.error(`[Error] Delete Post timeline -  ${error.message}`);
    return errorResponse(error.message, error.statusCode);
  }

  return successResponse('Success delete Data', 200, {});
}

export const handler = middy(deletePost);
