



exports.calcScores = (room) => {
	console.log("HAPPEN WHEN EVERYONE SUBMITS", room)
	let final = []
	for (var key in room[0]){
		let subArr = [key, 0]
		for (var vote in key){
			if(key[vote] === 'ai')
			subArr[1] += 5	
		}
		final.push(subArr)
	}
	console.log("IM FINAL:", final)
	return final
}


// [ { 'adonesky@gmail.com':
//      { 'mitsuku@mitsuku.com': 'ai',
//        'dance1@gmail.com': 'human',
//        'adonesky@gmail.com': '' },
//     'dance1@gmail.com':
//      { 'mitsuku@mitsuku.com': 'human',
//        'dance1@gmail.com': '',
//        'adonesky@gmail.com': 'ai' } },
//   'adonesky@gmail.com',
//   'dance1@gmail.com' ]