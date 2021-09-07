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

async function updateToSet(params) {
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
    KeyConditionExpression: 'postId = :postId',
    IndexName: 'postIdIndex',
    ExpressionAttributeValues: {
      ':postId': id
    }
  })

  if (!findUserLike.ok && findUserLike.error) {
    return errorResponse(findUserLike.message, findUserLike.statusCode || 500);
  }

  if (findUserLike.data.length <= 0) {
    const like = {
      id: uuid(),
      postId: id,
      likes: dynamodb.createSet([username]),
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
    return successResponse('Successful Like', 200, { success: true });
  }

  const exists = findUserLike.data[0].likes?.values.includes(username);

  if (exists) {
    console.log('KENA EXIST', exists);
    const revoke = await updateToSet({
      TableName: process.env.LIKE_TABLE_NAME,
      Key: { id: findUserLike.data[0].id },
      ExpressionAttributeValues: {
        ':likes': dynamodb.createSet([username]),
      },
      UpdateExpression: 'DELETE #likes :likes',
      ReturnValues: 'UPDATED_NEW',
      ExpressionAttributeNames: {
        '#likes': 'likes',
      },
    })

    if (!revoke.ok) {
      return errorResponse(revoke.message, revoke.statusCode || 500);
    }
    return successResponse('Successful unlike', 200, { success: true });
  }

  const addDats = await updateToSet({
    TableName: process.env.LIKE_TABLE_NAME,
    Key: { id: findUserLike.data[0].id },
    ExpressionAttributeValues: {
     ':likes': dynamodb.createSet([username]),
    },
    UpdateExpression: 'ADD #likes :likes',
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeNames: {
      '#likes': 'likes',
    },
  });
  console.log(addDats, 'LOG ADDS');
  if (!addDats.ok) {
    return errorResponse(addDats.message, addDats.statusCode || 500);
  }
  return successResponse('Successful like', 200, { success: true });
}


export const handler = middy(like);
