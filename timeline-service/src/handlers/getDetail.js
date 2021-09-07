/* eslint-disable import/prefer-default-export */
import AWS from 'aws-sdk';
import bunyan from 'bunyan';
import { NotFound, InternalServerError } from 'http-errors';

const log = bunyan.createLogger({ name: 'timeline-services' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getDetail(params) {
  let result;
  try {
    const getItem = await dynamodb.get(params).promise();

    result = getItem.Item;
    if (!result) {
      throw new NotFound(`Not Found ${params.Key.id}`);
    }
  } catch (error) {
    log.error(`[Error] get Detail-  ${error.message}`);
    if (error instanceof NotFound) {
      throw new NotFound(`Not Found ${params.Key.id}`);
    }
    throw new InternalServerError(error.message);
  }

  return result;
}

export default getDetail;
