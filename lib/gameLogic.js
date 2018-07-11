

exports.calcScores = (room) => {
  return new Promise(function(resolve, reject){

  const scoreObj = {};
  const fixedObj = {}
  const winners = []

for(var obj of room){
  var username = Object.keys(obj)[0]
  console.log("USERNAME IN FIXOBJ SORT", username)
    fixedObj[username] = obj[username]
  }


  for (var voter in fixedObj) {
    if (!scoreObj[voter]) {
      scoreObj[voter] = 0;
    }
  }

  console.log(fixedObj)


  for (var voter in fixedObj) {
    for (const person in fixedObj[voter]) {
      if (person === 'mitsuku@mitsuku.com' && fixedObj[voter][person] === 'ai') {
        scoreObj[voter] += 5;
      } else if (fixedObj[voter][person] === 'ai') {
        scoreObj[person] += 5;
      }
    }
  }

  let highScore = 0;
  for(var user in scoreObj){
    if(scoreObj[user] >= highScore){
      highScore = scoreObj[user]
    }
  }

  for(var user in scoreObj){
    if(scoreObj[user] === highScore){
      winners.push(user)
    }
  }

    // return ([scoreObj, winners])

  resolve([scoreObj, winners])
})

}


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
