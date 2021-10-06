import { InternalServerError, NotFound, Forbidden } from 'http-errors';
import { v4 as uuid } from 'uuid';
import bunyan from 'bunyan';
import { putComment, get, query, deleteItem } from '../repositories/commentRepositories'
import { PREFIX } from '../lib/randomName'

const log = bunyan.createLogger({ name: 'comment-services' });
class NestedCommentServices {
  async createNestedComment(payload) {
    console.log(payload ,'LOG PAYLOAD');
    const { username, nestedComment, commentId, postId } = payload;
    const randomNestedCommentId = uuid();
    const date = new Date().toISOString()
    const query = {
      TableName: process.env.NESTED_COMMENT_TABLE_NAME,
      Item: {
        id: randomNestedCommentId,
        postId,
        nestedComment,
        commentId,
        username,
        totalLike: 0, //default to 0
        createdAt: date,
        modifiedAt: date,
      }
    }
    const getComment = await this.getCommentDetail(commentId)
    console.log(getComment, 'log get comment');
    const getCommentQuery = await this.getCommentQuery(commentId, username)
    console.log(getCommentQuery, 'LOG COMMEENT QUERY');
    if (getCommentQuery.length > 0) {
      Object.assign(query.Item, { generatedName: getCommentQuery[0]?.generatedName })
    } else {
      const getNestedCommentDetail = await this.getNestedCommentDetail(commentId, username)
      if (getNestedCommentDetail.length > 0) {
        Object.assign(query.Item, { generatedName: getNestedCommentDetail[0].generatedName })
      } else {
        console.log('COBA KENA MARI');
        var name = PREFIX[Math.floor(Math.random() * PREFIX.length)];
        Object.assign(query.Item, { generatedName: name })
      }

    }
    try {
      await putComment(query);
    } catch (error) {
      throw new InternalServerError(error);
    }

    return { nestedComment, generatedName: query.Item.generatedName  }
  }

  async getCommentDetail(id) {
    let result;
    const params = {
      TableName: process.env.COMMENT_TABLE_NAME,
      Key: { id }
    };
    try {
      const getItem = await get(params)
  
      result = getItem.Item;

      if (!result) {
        throw new NotFound(`Not Found ${id}`);
      }
    } catch (error) {
      log.error(`[Error] get Comment Detail-  ${error.message}`);
      throw new InternalServerError(error.message);
    }
  
    return result;
  }


  async getNestedCommentDetail(id, username) {
    let result;
    const params = {
      TableName: process.env.NESTED_COMMENT_TABLE_NAME,
      IndexName: 'commentIdAndUsernameIndex',
      Limit: 1,
      KeyConditionExpression: "#username = :username AND #commentId = :commentId",
      ExpressionAttributeNames: {
        '#username': 'username',
        '#commentId': 'commentId'
      },
      ExpressionAttributeValues: {
        ':username': username,
        ':commentId': id
      }
    };
    try {
      const getItem = await query(params)
  
      result = getItem.Items;
    } catch (error) {
      log.error(`[Error] get Nested Detail-  ${error.message}`);
      throw new InternalServerError(error.message);
    }
  
    return result;
  }

  async getCommentQuery(id, username) {
    let result;
    const params = {
      TableName: process.env.COMMENT_TABLE_NAME,
      IndexName: 'idAndUsernameIndex',
      Limit: 1,
      KeyConditionExpression: "#username = :username AND #id = :id",
      ExpressionAttributeNames: {
        '#username': 'username',
        '#id': 'id'
      },
      ExpressionAttributeValues: {
        ':username': username,
        ':id': id
      }
    };
    try {
      const getItem = await query(params)
  
      result = getItem.Items;
    } catch (error) {
      log.error(`[Error] get Detail-  ${error.message}`);
      throw new InternalServerError(error.message);
    }
  
    return result;
  }

  async getAllNestedComments(payload, queryString) {
    const { limit = 10, evaluatedKey, createdAt, commentId } = queryString;
    console.log(queryString, 'LOG TEST');
    const date = new Date().toISOString();
    const params = {
      TableName: process.env.NESTED_COMMENT_TABLE_NAME,
      Limit: limit,
      IndexName: 'commentIdAndCreatedAtIndex',
      KeyConditionExpression: '#commentId = :commentId AND #createdAt <= :createdAt',
      ScanIndexForward: false,
      ExpressionAttributeValues: {
        ':commentId': payload.commentId,
        ':createdAt': date,
      },
      ExpressionAttributeNames: {
        '#commentId': 'commentId',
        '#createdAt': 'createdAt',
      },
    };
    if (evaluatedKey) {
      Object.assign(params, { ExclusiveStartKey: { id: evaluatedKey, createdAt, commentId } });
    }

    const getItem = await query(params)
  
    return getItem;
  }

  async deleteNestedComment(payload) {
    const { username, nestedCommentId} = payload
    const getNestedComment = await this.getCommentByCommentId(nestedCommentId)
    if (getNestedComment.username !== username) {
      throw new Forbidden('Cannot access this comment')
    }
    try {
      const query ={
        TableName: process.env.NESTED_COMMENT_TABLE_NAME,
        Key: id
      }
      await deleteItem(query)
      return { success: true } 
    } catch (error) {
      throw new InternalServerError(error)
    }
  }
}

export default NestedCommentServices