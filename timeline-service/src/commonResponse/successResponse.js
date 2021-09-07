/**
 * Success Response.
 * @param {string} message - message success.
 * @param {string} statusCode - resposne status code.
 * @param {object} payload - payload data
 */
const successsResponse = (message, statusCode, payload) => ({
  statusCode,
  body: JSON.stringify({
    ok: true,
    data: {
      ...payload,
    },
    message,
  }),
});
export default successsResponse;
