import middy from '../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponse, successResponseArray } from '../commonResponse';
import CommentService from '../services/commentService';
const commentService = new CommentService();
const log = bunyan.createLogger({ name: 'comment-services' });

const getCommentsHandler = async (event) => {
  const {
    requestContext: { authorizer: { username } },
    pathParameters: { postId },
    queryStringParameters
  } = event;

  try {
    const result = await commentService.getCommentByPostId({username, postId }, queryStringParameters)
    return successResponseArray('Success Get Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(getCommentsHandler)