const test = [
  {
    id: 5,
    date: '2021-08-30T13:31:50.524Z',
  },
  {
    id: 2,
    date: '2021-08-30T13:31:20.524Z',
  },
  {
    id: 3,
    date: '2021-08-30T13:31:30.524Z',
  },
  {
    id: 1,
    date: '2021-08-30T13:31:10.524Z',
  },
  {
    id: 4,
    date: '2021-08-30T13:31:40.524Z',
  },
];
const allowedBody = [
  'text',
  'type',
];

const dats = {
  text: "WOIIII"
};
const Obs = Object.keys(dats);
for (let i = 0; i < allowedBody.length; i += 1) {
  const allow = Obs.includes(allowedBody[i]);
  console.log(allow);
  if (!allow) {
   console.log('WOII');
  }
}