/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
import { v4 as uuid } from 'uuid';
import { InternalServerError, NotFound, Forbidden } from 'http-errors';
import {
  query,
  put,
  get,
  deleteItem,
  scanItem
} from '../repositories/commentRepositories';

class TimelineService {
  async getAll(queryString, username) {
    const {
      limit = 10,
      evaluatedKey,
      type,
      createdAt,
    } = queryString;
    const date = new Date().toISOString();
    const params = {
      TableName: process.env.TIMELINE_TABLE_NAME,
      Limit: limit,
      IndexName: 'type-createdAt-index',
      KeyConditionExpression: '#type = :type AND #createdAt <= :createdAt',
      ScanIndexForward: false,
      ExpressionAttributeValues: {
        ':type': type,
        ':createdAt': date,
      },
      ExpressionAttributeNames: {
        '#type': 'type',
        '#createdAt': 'createdAt',
      },
    };
    if (evaluatedKey) {
      Object.assign(params, { ExclusiveStartKey: { id: evaluatedKey, type, createdAt } });
    }

    const result = await query(params);

    const Items = [];

    if (result.Items.length > 0) {
      for (let i = 0; i < result.Items.length; i += 1) {
        const like = result.Items[i];
        if (like.likes?.values?.includes(username)) {
          Items[i] = { ...result.Items[i], liked: true };
        } else {
          Items[i] = { ...result.Items[i], liked: false };
        }
      }
    }
    const SortByDate = Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      items: SortByDate,
      result,
    };
  }

  async createTimeline(payload) {
    const { username, text, type } = payload;
    const date = new Date().toISOString();
    const get = await query({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Limit: 1,
      IndexName: 'usernameAndCreatedAtType',
      KeyConditionExpression: '#username = :username AND #createdAt <= :createdAt',
      ScanIndexForward: false,
      ExpressionAttributeValues: {
        ':username': username,
        ':createdAt': date,
      },
      ExpressionAttributeNames: {
        '#username': 'username',
        '#createdAt': 'createdAt',
      },
    });
    console.log(get,'LOG GET TEST')
    if (get.Items.length) {
      const createdAt = get.Items[0].createdAt
      const getLastPostTime = new Date() - new Date(createdAt);
      if ( process.env.SET_TIME_CREATE_TIMELINE > getLastPostTime) {
        throw new Forbidden('You cannot publish at this time')
      }
    }

    const randomId = uuid();
    const timeline = {
      id: randomId,
      text,
      username,
      type,
      totalLikes: 0, // default value to 0
      totalComments: 0, // default value to 0
      createdAt: date,
      modifiedAt: date,
    };

    const createQuery = {
      TableName: process.env.TIMELINE_TABLE_NAME,
      Item: timeline,
    };

    await put(createQuery);
    return timeline;
  }

  async deleteTimeline(id, username) {
    const getDetailPost = await this.getDetail({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    });

    if (getDetailPost.username !== username) {
      throw new NotFound(`${username} cant delete id ${id}`);
    }

    await deleteItem({
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    });

    if (getDetailPost.totalLike) {
      await deleteItem({
        TableName: process.env.LIKE_TABLE,
        Key: { id },
      });
    }

    if (getDetailPost.totalComment) {
      await deleteItem({
        TableName: process.env.COMMENT,
        Key: { id },
      });
    }

    if (getDetailPost.nestedComment) {
      await deleteItem({
        TableName: process.env.NESTED_COMMENT,
        Key: { id },
      });
    }
  }

  async getDetail(params) {
    const getItem = await get(params);

    const result = getItem.Item;
    if (!result) {
      throw new NotFound(`Not Found ${params.Key.id}`);
    }
    return result;
  }
}

export default TimelineService;
