/* eslint-disable import/prefer-default-export */
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponseArray } from '../commonResponse';

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAllPost(event) {
  let result;
  const { limit = 10, evaluatedKey, type, createdAt } = event.queryStringParameters;
  const { username } = event.requestContext.authorizer;
  const date = new Date().toISOString();
  const params = {
    TableName: process.env.TIMELINE_TABLE_NAME,
    Limit: limit,
    IndexName: 'type-createdAt-index',
    KeyConditionExpression: '#type = :type AND #createdAt <= :createdAt',
    ScanIndexForward: false,
    ExpressionAttributeValues: {
      ':type': type,
      ':createdAt': date,
    },
    ExpressionAttributeNames: {
      '#type': 'type',
      '#createdAt': 'createdAt',
    },
  };
  if (evaluatedKey) {
    Object.assign(params, { ExclusiveStartKey: { id: evaluatedKey, type, createdAt } });
  }

  try {
    // result = await dynamodb.scan(params).promise();
    result = await dynamodb.query(params).promise();
    console.log(result, 'LOG RESULT BOS');
  } catch (error) {
    log.error(`[Error] Get All Post timeline -  ${error.message}`);
    return errorResponse(error.message, 500);
  }

  const Items = [];

  if (result.Items.length > 0) {
    for (let i = 0; i < result.Items.length; i += 1) {
      const like = result.Items[i];
      if (like.likes?.values?.includes(username)) {
        Items[i] = { ...result.Items[i], liked: true };
      } else {
        Items[i] = { ...result.Items[i], liked: false };
      }
    }
  }
  const SortByDate = Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  log.info('Successfully Get Timeline');
  return successResponseArray('Success get all post', 200, result, SortByDate);
}

export const handler = middy(getAllPost);
