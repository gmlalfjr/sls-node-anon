/**
 * Represents a book.
 * @param {string} message - message success.
 * @param {string} statusCode - resposne status code.
 * @param {object} payload - payload data
 */
const successResponseArray = (message, statusCode, payload, items) => {
  const { Items, Count, LastEvaluatedKey } = payload;
  return {
    statusCode,
    body: JSON.stringify({
      ok: true,
      data: items,
      count: Count,
      lastEvaluatedKey: LastEvaluatedKey || null,
      message,
    }),
  };
};

export default successResponseArray;
