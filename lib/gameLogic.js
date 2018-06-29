

exports.calcScores = (room) => {
  const scoreObj = {};
  for (var voter in room[0]) {
    if (!scoreObj[voter]) {
      scoreObj[voter] = 0;
    }
  }


  for (var voter in room[0]) {
    for (const person in room[0][voter]) {
      if (person === 'mitsuku@mitsuku.com' && room[0][voter][person] === 'ai') {
        scoreObj[voter] += 5;
      } else if (room[0][voter][person] === 'ai') {
        scoreObj[person] += 5;
      }
    }
  }


  console.log('FINAL SCORE OBJ', scoreObj);
  return scoreObj;
};


// [ { 'adonesky@gmail.com':
//      { 'mitsuku@mitsuku.com': 'ai',
//        'dance1@gmail.com': 'human',
//        'adonesky@gmail.com': '' },
//     'dance1@gmail.com':
//      { 'mitsuku@mitsuku.com': 'ai',
//        'dance1@gmail.com': '',
//        'adonesky@gmail.com': 'ai' } },
//   'adonesky@gmail.com',
//   'dance1@gmail.com' ]


// desired output =

// [[adonesky, 10], [dance1, 5]]

// voter = dance1@gmail.com

// [dance1, 0]

// vote =
