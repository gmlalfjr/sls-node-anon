import middy from '../../lib/commonMiddleware';
import bunyan from 'bunyan';

import { errorResponse, successResponse } from '../../commonResponse';
import NestedCommentServices from '../../services/nestedCommentService';
const nestedCommentServices = new NestedCommentServices();
const log = bunyan.createLogger({ name: 'comment-services' });

const deleteNestedCommentHandler = async (event) => {
  const {
    requestContext: { authorizer: { username } },
    pathParameters: { nestedCommentId }
  } = event;

  try {
    const result = await nestedCommentServices.deleteNestedComment({username, nestedCommentId})
    return successResponse('Success Delete Nested Comment', 200, result);
  } catch (error) {
    log.error(error);
    return errorResponse(error.message, error.statusCode);
  }
};

export const handler = middy(deleteNestedCommentHandler)