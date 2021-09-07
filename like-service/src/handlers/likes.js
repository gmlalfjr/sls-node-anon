import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';
import ProcessError from '../commonResponse/processError'

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function findPost(params) {
  let result;
  try {
    const getItem = await dynamodb.get(params).promise();

    result = getItem?.Item;
    if (!result) {
      throw new ProcessError(`Not Found ${params.Key.id}`, 404);
    }

  } catch (error) {
    log.error(`[Error] get Detail-  ${error.message}`);
    if (error instanceof ProcessError) {
      throw new ProcessError(`Not Found ${params.Key.id}`, 404);
    }
    throw ProcessError(error.message, 500);
  }

  return result;
}

async function updateToSet(params) {
  try {
    await dynamodb.update(params).promise();
  } catch (error) {
    log.error(error);
    throw ProcessError(error.message, 500);
  }
}

async function like(event) {
  try {
    const { id } = event.pathParameters;

    const { username } = event.requestContext.authorizer;
  
    const findPostData = await findPost({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id }
    });
    const exists = findPostData.likes?.values.includes(username);
  
    if (exists) {
      await updateToSet({
        TableName: process.env.TIMELINE_TABLE_NAME,
        Key: { id },
        ExpressionAttributeValues: {
          ':likes': dynamodb.createSet([username]),
          ':decr': -1
        },
        UpdateExpression: 'DELETE #likes :likes ADD totalLikes :decr',
        ReturnValues: 'UPDATED_NEW',
        ExpressionAttributeNames: {
          '#likes': 'likes',
        },
      })
      return successResponse('Successful unlike', 200, { success: true });
    }
  
    await updateToSet({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id},
      ExpressionAttributeValues: {
       ':likes': dynamodb.createSet([username]),
       ':incr': 1
      },
      UpdateExpression: 'ADD #likes :likes, totalLikes :incr',
      ReturnValues: 'ALL_NEW',
      ExpressionAttributeNames: {
        '#likes': 'likes',
      },
    });
    return successResponse('Successful like', 200, { success: true });
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500);
  }
}


export const handler = middy(like);
