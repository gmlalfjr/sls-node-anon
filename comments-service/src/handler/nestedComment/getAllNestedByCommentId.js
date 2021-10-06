import middy from '../../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponseArray } from '../../commonResponse';
import NestedCommentServices from '../../services/nestedCommentService';
const nestedCommentServices = new NestedCommentServices();
const log = bunyan.createLogger({ name: 'comment-services' });

const getNestedCommentHandler = async (event) => {
  const {
    requestContext: { authorizer: { username } },
    pathParameters: { commentId },
    queryStringParameters
  } = event;

  try {
    const result = await nestedCommentServices.getAllNestedComments({username, commentId}, queryStringParameters)
    return successResponseArray('Success Get Nested Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(getNestedCommentHandler)