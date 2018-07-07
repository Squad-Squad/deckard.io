

exports.calcScores = (room) => {
  const scoreObj = {};
  // const fixedObj = {}

// for(var obj in room)
//   for(var key in obj){
//     fixedObj[key] = obj[key]
//   }

//   console.log(fixedObj)

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



// [ { adonesky:
//      { 'mitsuku@mitsuku.com': 'human',
//        adonesky: '',
//        dancer: 'human',
//        fool12: 'ai' } },
//   { fool12:
//      { 'mitsuku@mitsuku.com': 'ai',
//        adonesky: 'human',
//        dancer: 'human',
//        fool12: '' } },
//   { dancer:
//      { 'mitsuku@mitsuku.com': 'ai',
//        adonesky: 'ai',
//        dancer: '',
//        fool12: 'human' } } ]


// desired output =

// [[adonesky, 10], [dance1, 5]]

// voter = dance1@gmail.com

// [dance1, 0]

// vote =
