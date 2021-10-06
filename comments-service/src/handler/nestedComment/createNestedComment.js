import middy from '../../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponse } from '../../commonResponse';
import NestedCommentServices from '../../services/nestedCommentService';
const nestedCommentServices = new NestedCommentServices();
const log = bunyan.createLogger({ name: 'comment-services' });
const validateRequest = (event) => {
  const allowedBody = [
    'nestedComment'
  ];

  const keyBody = Object.keys(event.body);
  for (let i = 0; i < allowedBody.length; i += 1) {
    const allow = keyBody?.includes(allowedBody[i]);
    if (!allow) {
      return errorResponse('invalid body request', 400);
    }
  }
  return null;
}

const createNestedCommentHandler = async (event) => {
  const validate = validateRequest(event);
  if (validate !== null) {
    return validate;
  }
  const {
    body: { nestedComment },
    requestContext: { authorizer: { username } },
    pathParameters: { commentId, postIds: postId }
  } = event;

  try {
    const result = await nestedCommentServices.createNestedComment({ nestedComment, username, commentId, postId })
    return successResponse('Success Create Nested Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(createNestedCommentHandler)