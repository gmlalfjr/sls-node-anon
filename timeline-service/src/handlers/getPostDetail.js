/* eslint-disable import/prefer-default-export */
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';
import getDetail from './getDetail';

const log = bunyan.createLogger({ name: 'timeline-services' });
async function getPostDetail(event) {
  let result;
  const { id } = event.pathParameters;
  try {
    const params = {
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    };
    result = await getDetail(params);
  } catch (error) {
    log.error(`[Error] Post timeline -  ${error.message}`);
    return errorResponse(error.message, error.statusCode);
  }

  return successResponse('Success get post', 200, result);
}

export const handler = middy(getPostDetail);
