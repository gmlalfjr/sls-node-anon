import middy from '../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponse } from '../commonResponse';
import CommentService from '../services/commentService';
const commentService = new CommentService();
const log = bunyan.createLogger({ name: 'comment-services' });

const deleteCommentHandler = async (event) => {
  const {
    requestContext: { authorizer: { username } },
    pathParameters: { commentId }
  } = event;

  try {
    const result = await commentService.deleteComment(commentId, username)
    return successResponse('Success Delete Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(deleteCommentHandler)