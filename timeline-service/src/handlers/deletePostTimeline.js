/* eslint-disable import/prefer-default-export */
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import { NotFound } from 'http-errors';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';
import getDetail from './getDetail';

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deletePost(event) {
  const { id } = event.pathParameters;
  const { username } = event.requestContext.authorizer;

  try {
    const get = await getDetail({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    });
    if (get.username !== username) {
      throw new NotFound(`${username} cant delete id ${id}`);
    }
    await dynamodb.delete({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    }).promise();
  } catch (error) {
    log.error(`[Error] Delete Post timeline -  ${error.message}`);
    return errorResponse(error.message, error.statusCode);
  }

  return successResponse('Success delete Data', 200, {});
}

export const handler = middy(deletePost);
