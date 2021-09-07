import middy from '../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponse } from '../commonResponse';
import CommentService from '../services/commentService';
const commentService = new CommentService();
const log = bunyan.createLogger({ name: 'comment-services' });
const validateRequest = (event) => {
  const allowedBody = [
    'comment'
  ];

  const keyBody = Object.keys(event.body);
  console.log(keyBody, 'LOG KEY BODY');
  for (let i = 0; i < allowedBody.length; i += 1) {
    const allow = keyBody?.includes(allowedBody[i]);
    if (!allow) {
      return errorResponse('invalid body request', 400);
    }
  }
  return null;
}

const createCommentHandler = async (event) => {
  const validate = validateRequest(event);
  if (validate !== null) {
    return validate;
  }
  const {
    body: { comment },
    requestContext: { authorizer: { username } },
    pathParameters: { postId }
  } = event;

  try {
    const result = await commentService.createComment({ comment, username, postId })
    return successResponse('Success Create Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(createCommentHandler)