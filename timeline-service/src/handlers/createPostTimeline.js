/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable import/prefer-default-export */
import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
  const date = new Date().toISOString();
  const randomId = uuid();
  const timeline = {
    id: randomId,
    text,
    username,
    type,
    totalLikes: 0, // default value to 0
    totalComments: 0, // default value to 0
    createdAt: date,
    modifiedAt: date,
  };

  try {
    const createQuery = {
      TableName: process.env.TIMELINE_TABLE_NAME,
      Item: timeline,
    };

    await dynamodb.put(createQuery).promise();
  } catch (error) {
    log.error(`[Error] Post timeline -  ${error.message}`);
    return errorResponse(error.message, error.statusCode || 500);
  }
  return successResponse('Successful Post Timeline', 200, timeline);
}

export const handler = middy(createTimeline);
