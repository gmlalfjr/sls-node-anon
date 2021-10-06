/* eslint-disable import/prefer-default-export */
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponseArray } from '../commonResponse';
import TimelineService from '../service/timelineService';

const log = bunyan.createLogger({ name: 'timeline-services' });
const timeline = new TimelineService();

async function getAllPost(event) {
  let res;
  const {
    queryStringParameters,
    requestContext: { authorizer: { username } },
  } = event;

  try {
    res = await timeline.getAll(queryStringParameters, username);
    console.log(res, 'LOG RES');
    log.info('Successfully Get Timeline');
    return successResponseArray('Success get all post', 200, res.result, res.items);
  } catch (error) {
    log.error(`[Error] Get All Post timeline -  ${error.message}`);
    return errorResponse(error.message, 500);
  }
}

export const handler = middy(getAllPost);
