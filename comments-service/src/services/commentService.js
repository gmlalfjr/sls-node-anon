import { Forbidden, InternalServerError, NotFound } from 'http-errors';
import { v4 as uuid } from 'uuid';
import bunyan from 'bunyan';
import { putComment, get, query, deleteItem } from '../repositories/commentRepositories'
import { PREFIX } from '../lib/randomName'

const log = bunyan.createLogger({ name: 'comment-services' });
class CommentServices {
  async createComment(payload) {
    const { username, comment, postId } = payload;
    const randomCommentId = uuid();
    const date = new Date().toISOString()
    const query = {
      TableName: process.env.COMMENT_TABLE_NAME,
      Item: {
        id: randomCommentId,
        comment,
        postId,
        username,
        totalLike: 0, //default to 0
        createdAt: date,
        modifiedAt: date,
        generatedName: ""
      }
    }
    await this.getPostDetail(postId)
    const getComment = await this.getCommentDetail(postId, username);
    if (getComment.length > 0) {
      Object.assign(query.Item, { generatedName: getComment[0].generatedName })
    } else {
      const getNestedCommentDetail = await this.getNestedCommentDetail(postId, username)
      console.log(getNestedCommentDetail, 'LOG NESTED COMMENT');
      if (getNestedCommentDetail.length > 0) {
        Object.assign(query.Item, { generatedName: getNestedCommentDetail[0].generatedName })
      } else {
        console.log('JADI KENA MARII');
        var name = PREFIX[Math.floor(Math.random()*PREFIX.length)];
        Object.assign(query.Item, { generatedName: name })
      }

    }
    try {
      await putComment(query);
    } catch (error) {
      throw new InternalServerError(error);
    }

    return { comment, generatedName: query.Item.generatedName  }
  }

  async getPostDetail(id) {
    let result;
    const params = {
      TableName: process.env.TIMELINE_TABLE_NAME,
      Key: { id },
    };
    try {
      const getItem = await get(params)
  
      result = getItem.Item;
      if (!result) {
        throw new NotFound(`Not Found ${id}`);
      }
    } catch (error) {
      log.error(`[Error] get Detail-  ${error.message}`);
      if (error instanceof NotFound) {
        throw new NotFound(`Not Found ${id}`);
      }
      throw new InternalServerError(error.message);
    }
  
    return result;
  }


  async getCommentDetail(id, username) {
    let result;
    const params = {
      TableName: process.env.COMMENT_TABLE_NAME,
      IndexName: 'postIdAndUsernameIndex',
      Limit: 1,
      KeyConditionExpression: "#username = :username AND #postId = :postId",
      ExpressionAttributeNames: {
        '#username': 'username',
        '#postId': 'postId'
      },
      ExpressionAttributeValues: {
        ':username': username,
        ':postId': id
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

  async getCommentByPostId(payload, queryParams) {
    await this.getPostDetail(payload.postId);
    const get = await this.getComments(payload, queryParams);
    return get;
  }

  async getComments(payload, queryParams) {
    let result;
    const date = new Date().toISOString();
    const dynamodbQuery = {
      TableName: process.env.COMMENT_TABLE_NAME,
      Limit: queryParams.limit,
      IndexName: 'postIdAndcreatedAtIndex',
      KeyConditionExpression: "#postId = :postId AND #createdAt <= :createdAt",
      ScanIndexForward: false,
      ExpressionAttributeValues: {
        ':createdAt':date,
        ':postId': payload.postId
      },
      ExpressionAttributeNames: {
        '#createdAt': 'createdAt',
        '#postId': 'postId'
      }
    };

    if (queryParams.evaluatedKey) {
      Object.assign(dynamodbQuery, { ExclusiveStartKey:
        {
          id: queryParams.evaluatedKey,
          createdAt: queryParams.createdAt,
          postId: queryParams.postId
        }
      });
    }
    try {
      const queryComment = await query(dynamodbQuery)
      result = this._getUserComment(queryComment, payload.username);
      return result
    } catch (error) {
      log.error(`[Error] get All Comments-  ${error.message}`);
      throw new InternalServerError(error.message);
    }
  }

  _getUserComment(arrayOfComments, username) {
    let Items = [];
    for (let i = 0; i < arrayOfComments.Items.length; i++) {
      if (arrayOfComments.Items[i]?.username === username) {
        Items[i] = {...arrayOfComments.Items[i], myComment: true }
        continue;
      }
      Items[i] = {...arrayOfComments.Items[i], myComment: false}
    }
    return {
      Items,
      Count: arrayOfComments.Count,
      ScannedCount: arrayOfComments.ScannedCount,
      LastEvaluatedKey: arrayOfComments.LastEvaluatedKey
    };
  }

  async deleteComment(id, username) {
    const getComment = await this.getCommentByCommentId(id)
    if (getComment.username !== username) {
      throw new Forbidden('Cannot access this comment')
    }
    try {
      const query ={
        TableName: process.env.COMMENT_TABLE_NAME,
        Key: id
      }
      await deleteItem(query)
      return { success: true } 
    } catch (error) {
      throw new InternalServerError(error)
    }
  }

  async getCommentByCommentId(id) {
    try {
      const query ={
        TableName: process.env.COMMENT_TABLE_NAME,
        Key: id
      }
      const getComment = await get(query)
      if (!getComment) {
        throw new NotFound(`Not Found Comment ${id}`)
      }
      return getComment.Item
    } catch (error) {
      throw new InternalServerError(error)
    }
  }

  async getNestedCommentDetail(id, username) {
    let result;
    const params = {
      TableName: process.env.NESTED_COMMENT_TABLE_NAME,
      IndexName: 'postIdAndUsernameIndex',
      Limit: 1,
      KeyConditionExpression: "#username = :username AND #postId = :postId",
      ExpressionAttributeNames: {
        '#username': 'username',
        '#postId': 'postId'
      },
      ExpressionAttributeValues: {
        ':username': username,
        ':postId': id
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
}

export default CommentServices