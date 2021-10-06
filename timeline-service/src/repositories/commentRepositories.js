import AWS from 'aws-sdk';
import {InternalServerError} from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const put = async (payload) => {
  try {
    await dynamodb.put(payload).promise();
  } catch (error) {
    throw new InternalServerError(error);
  }
};
const get = async (params) => {
  try {
    const getItem = await dynamodb.get(params).promise();
    return getItem;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

const query = async (params) => {
  try {
    const getItem = await dynamodb.query(params).promise();
    return getItem;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

const deleteItem = async (params) => {
  try {
    const getItem = await dynamodb.delete(params).promise();
    return getItem;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

const scanItem = async (params) => {
  try {
    return await dynamodb.scan(params).promise();
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

export {
  put,
  get,
  query,
  deleteItem,
  scanItem
};
