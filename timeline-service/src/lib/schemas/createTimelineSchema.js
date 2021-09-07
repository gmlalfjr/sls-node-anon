const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
        },
      },
      required: ['text'],
    },
  },
  required: ['body'],
};

export default schema;
