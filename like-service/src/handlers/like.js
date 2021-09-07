import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import middy from '../lib/commonMiddleware';
import { errorResponse, successResponse } from '../commonResponse';

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function findPost(params) {
  let result;
  try {
    const getItem = await dynamodb.get(params).promise();

    result = getItem?.Item;
  } catch (error) {
    log.error(`[Error] get post-  ${error.message}`);
    return {
      ok: false,
      message: error.message,
      statusCode: 500,
    };
  }

  if (!result) {
    return {
      ok: false,
      message: `Post ${params.Key.id} not found`,
      statusCode: 400,
    };
  }

  return {
    ok: true,
    data: result,
  };
}

async function findLike(params) {
  let result;
  try {
    const getItem = await dynamodb.query(params).promise();

    result = getItem.Items;
  } catch (error) {
    log.error(`[Error] get Like-  ${error.message}`);
    return {
      ok: false,
      message: error.message,
      statusCode: 500,
      error: true
    };
  }

  if (!result) {
    return {
      ok: false,
      message: 'Not Found Like',
      statusCode: 404,
    };
  }

  return {
    ok: true,
    data: result,
  };
}

async function createLike(params) {
  try {
   const create  = await dynamodb.put(params).promise();
   return { data: create.Items, ok: true};
  } catch (error) {
    return {
      ok: false,
      message: `Internal Server Error`,
      statusCode: 500,
    };
  }
}

async function deleteLike(params) {
  try {
    await dynamodb.delete(params).promise();
    return {
      ok: true,
      message: 'Succes Delete'
    };
  } catch (error) {
    console.log(error, 'LOG ERROR DELETE');
    return {
      ok: false,
      message: `Internal Server Error`,
      statusCode: 500,
    };
  }
}
async function incrementOrDecrement(params) {
  try {
    await dynamodb.update(params).promise();
    return {
      ok: true,
      message: 'Succes incrementOrDecrement'
    };
  } catch (error) {
    console.log(error, 'LOG ERROR incrementOrDecrement');
    return {
      ok: false,
      message: `Internal Server Error`,
      statusCode: 500,
    };
  }
}

async function like(event) {
  const { id } = event.pathParameters;

  const { username } = event.requestContext.authorizer;
  const findPostData = await findPost({
    TableName: process.env.TIMELINE_TABLE_NAME,
    Key: { id }
  });
  console.log(findPostData, 'LOG FIND POST');
  if (!findPostData.ok) {
    return errorResponse(findPostData.message, findPostData.statusCode || 500);
  }

  const findUserLike = await findLike({
    TableName: process.env.LIKE_TABLE_NAME,
    KeyConditionExpression: 'postId = :postId AND username = :username',
    IndexName: 'postIdAndUsernameIndex',
    ExpressionAttributeValues: {
      ':postId': id,
      ':username': username
    }
  })
  console.log(findUserLike, 'LOG FIND USER LIKE');
  if (!findUserLike.ok && findUserLike.error) {
    return errorResponse(findUserLike.message, findUserLike.statusCode || 500);
  }

  if (findUserLike.data.length <= 0) {
    const like = {
      id: uuid(),
      postId: id,
      username
    };
    console.log(like, 'LIKE PAYLOAD' );
    const create = await createLike({
      TableName: process.env.LIKE_TABLE_NAME,
      Item: like,
    });
    console.log(create, 'LOG CREATE');
    if (!create.ok) {
      return errorResponse(create.message, create.statusCode || 500);
    }

    const inc = await incrementOrDecrement({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
      ExpressionAttributeValues: {
      ':incr': 1
      },
      UpdateExpression: 'ADD #totalLikes :incr',
      ReturnValues: 'UPDATED_NEW',
      ExpressionAttributeNames: {
        '#totalLikes': 'totalLikes',
    },
    });
    if (!inc.ok) {
      return errorResponse(inc.message, inc.statusCode || 500);
    }
    return successResponse('Successful Like', 200, { success: true });
  }
  console.log('KENA MAU DELETE');
  const del = await deleteLike({
    TableName: process.env.LIKE_TABLE_NAME,
    Key: { id: findUserLike.data[0].id } 
  })
  if (!del.ok) {
    return errorResponse(del.message, del.statusCode || 500);
  }
  const dec = await incrementOrDecrement({
    TableName: process.env.TIMELINE_TABLE_NAME,
    Key: { id },
    ExpressionAttributeValues: {
    ':decr': -1
    },
    UpdateExpression: 'ADD #totalLikes :decr',
    ReturnValues: 'UPDATED_NEW',
    ExpressionAttributeNames: {
      '#totalLikes': 'totalLikes',
  },
  });
  if (!dec.ok) {
    return errorResponse(dec.message, dec.statusCode || 500);
  }
  return successResponse('Successful Unlike', 200, { success: true });
}


export const handler = middy(like);
