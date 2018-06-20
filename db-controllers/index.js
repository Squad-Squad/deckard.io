const db = require('../database-postgresql/models');
const bcrypt = require('bcrypt');
const uniqueString = require('unique-string');
const sequelize = require('sequelize');

// db.sequelize.query('SELECT * FROM users').spread((results) => {
//   console.log('AAAAAAAAAAAAAAA', results[0]);
// })

//
// ─── USER TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMember = (email, password, zipcode, callback) => {
  let hashedPW;
  if (password) {
    const salt = bcrypt.genSaltSync(3);
    hashedPW = bcrypt.hashSync(password, salt);
  }
  db.models.User.create({
    email,
    password: hashedPW,
    zipcode,
  })
    .then((result) => {
      callback(result);
    })
    .catch((error) => {
      console.log(error);
    });
};

const saveRoomAndMembers = (roomName, zip, members, id, callback) => {
  
  let promisedMembers = members.map(memberEmail => db.models.User.findOne({
    where: {
      email: memberEmail,
    },
  }));
  let foundUsers = [];
  let newRoom = '';

  Promise.all(promisedMembers)
    .then((users) => {
      foundUsers = users;
      return db.models.Room.findOrCreate({
        where: {
          name: roomName,
          uniqueid: id,
          zipcode: zip,
        },
      });
    })
    .then((room) => {
      newRoom = room;
      let addUserPromises = [];
      foundUsers.forEach((user) => {
        addUserPromises.push(room[0].addUser(user));
      });
      return Promise.all(addUserPromises);
    })
    .then(() => {
      callback(null, newRoom, foundUsers);
    })
    .catch((error) => {
      console.log(error);
    });
};

//
// ─── MESSAGE TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMessage = (user_id, name, message, roomID, callback) => {
  console.log('Saving message', user_id, name, message, roomID);
  db.models.Room.findOne({
    where: {
      uniqueid: roomID,
    },
    attributes: ['id'],
    raw: true,
  })
    .then((primaryID) => {
      db.models.Message.create({
        name,
        message,
        room_id: primaryID.id,
      })
        .then((savedMessage) => {
          console.log('CREATED MESSAGE', savedMessage);
          callback(null, savedMessage);
        })
        .catch((error) => {
          callback(error);
        });
    })
    .catch((error) => {
      callback(error);
    });
};

const getMessages = (roomID, callback) => {
  db.models.Message.findAll({
    attributes: ['user_id', 'name', 'message'],
    include: [{
      model: db.models.Room,
      where: { uniqueid: roomID },
      attributes: [],
    }],
    raw: true,
  })
    .then((fetchedMessage) => {
      console.log('FETCHED MESSAGES', fetchedMessage);
      callback(null, fetchedMessage);
    })
    .catch((error) => {
      callback(error);
    });
};

//
// ─── ROOM TABLE HELPERS ─────────────────────────────────────────────────────────
//
const getRoomMembers = (roomID, callback) => {
  db.models.User.findAll({
    attributes: ['email', 'zipcode'],
    include: [{
      model: db.models.Room,
      where: { uniqueid: roomID },
      attributes: ['name', 'zipcode'],
      through: { attributes: [] },
    }],
  })
    .then((users) => {
      // console.log('Success getting users', users);
      callback(null, users);
    })
    .catch((error) => {
      callback(error);
    });
};

const getRooms = (email, callback) => {
    //Joseph using SQL to get user's rooms
    let sqlQuery = `SELECT rooms.id AS room_id, rooms.uniqueid AS room_uniqueid, rooms.name AS room_name 
    FROM room_users 
    FULL JOIN rooms 
    ON room_users.room_id = rooms.id  
    WHERE room_users.user_id = 
    (SELECT ID FROM users WHERE email = '${email}')
    ORDER BY rooms."createdAt" desc
    LIMIT 20;`
    db.sequelize.query(sqlQuery).spread((results) => {
      console.log('ROOOOOOOOOOOOMS', results);
      callback(null, results)
    })
};

const getWins = (email, callback) => {
  db.models.User
    .findOne({
      where: {email: email},
      attributes: ['wins']
    })
    .then((res) =>{
      callback(null, `${res.dataValues.wins}`)
    })
}

//
// ─── RESTAURANT TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveRestaurant = (name, roomID, callback) => {
  const promisedRoom = db.models.Room.findOne({
    where: {
      uniqueid: roomID,
    },
    attributes: ['id'],
    raw: true,
  });

  db.models.Restaurant.create({
    name,
  })
    .then((restaurant) => {
      Promise.all([promisedRoom])
        .then((room) => {
          restaurant.setRoom(room[0].id);
          callback(null, restaurant);
        })
        .catch((error) => {
          callback(error);
        });
    })
    .catch((error) => {
      callback(error);
    });
};

const saveCurrentRestaurant = (roomID, restaurantID, callback) => {
  const sqlQuery = `UPDATE rooms SET currentrestaurant = '${restaurantID}' WHERE uniqueid = '${roomID}';`;
  db.sequelize.query(sqlQuery).spread((results) => {
    console.log('AAAAAAAAAAAAAAA', results[0]);
  });
};

const getCurrentRestaurant = (roomID, callback) => {
  const sqlQuery = `SELECT currentrestaurant FROM rooms WHERE uniqueid = '${roomID}'`
  db.sequelize.query(sqlQuery).spread((results) => {
    console.log('GET VOTES', results);
    callback(null, results);
  });
};

const updateVotes = (voter, restaurant_id, name, roomId, nominator, callback) => {
  db.models.Restaurant.findOne({
    where: {
      name,
    },
    include: [{
      model: db.models.Room,
      where: {
        uniqueid: roomId,
      },
    }],
  })
    .then((restaurant) => {
      const currentVotes = restaurant.dataValues.votes;
      restaurant.update({
        votes: currentVotes + 1,
      })
        .then((result) => {
          callback(null, result);
        })
        .catch((error) => {
          callback(error);
        });
    })
    .catch((error) => {
      callback(error);
    });

  // Joseph using SQL to update votes table
  const strippedName = name.replace("'", '`');
  const sqlQuery = `INSERT INTO votes (restaurant_id, roomuniqueid, useremail, name, upvoted, created, updated, nominator) VALUES ('${restaurant_id}', '${roomId}', '${voter}', '${strippedName}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '${nominator}');`;
  db.sequelize.query(sqlQuery).spread((results) => {
    console.log('AAAAAAAAAAAAAAA', results[0]);
  });
  
  // Update query in case voter already vetoed. (Can't insert upvote if veto already exists for user for room)
  const sqlUpdateQuery = `UPDATE votes SET upvoted = true WHERE restaurant_id = '${restaurant_id}' AND roomuniqueid = '${roomId}' AND useremail = '${voter}';`;
  db.sequelize.query(sqlUpdateQuery).spread((results) => {
    console.log('UPDATE VOTE', results);
  });
};

const updateVetoes = (voter, restaurant_id, name, roomId, callback) => {
  db.models.Restaurant.findOne({
    where: {
      name,
    },
    include: [{
      model: db.models.Room,
      where: {
        uniqueid: roomId,
      },
    }],
  })
    .then((restaurant) => {
      restaurant.update({
        vetoed: true,
      })
        .then((result) => {
          callback(null, result);
        })
        .catch((error) => {
          callback(error);
        });
    })
    .catch((error) => {
      callback(error);
    });

    // Joseph using SQL to update votes table for veto
    const strippedName = name.replace("'", '`');
    const sqlQuery = `INSERT INTO votes (restaurant_id, roomuniqueid, useremail, name, upvoted, created, updated) VALUES ('${restaurant_id}', '${roomId}', '${voter}', '${strippedName}', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`
    db.sequelize.query(sqlQuery).spread((results) => {
      console.log('INSERT VETOE', results);
    });

    // Update query in case voter already upvoted. (Can't insert rejection if upvote already exists for user for room)
    const sqlUpdateQuery = `UPDATE votes SET upvoted = false WHERE restaurant_id = '${restaurant_id}' AND roomuniqueid = '${roomId}' AND useremail = '${voter}';`
    db.sequelize.query(sqlUpdateQuery).spread((results) => {
      console.log('UPDATE VETOE', results);
    });
};

const getScoreboard = (roomID, callback) => {
  db.models.Restaurant.findAll({
    attributes: ['name', 'votes', 'vetoed'],
    include: [{
      model: db.models.Room,
      where: { uniqueid: roomID },
      attributes: [],
    }],
    raw: true,
  })
    .then((scores) => {
      console.log('SCOREBOARD', scores);
      // callback(null, scores);
    })
    .catch((error) => {
      callback(error);
    });

  const sqlQuery = `SELECT CASE WHEN votes.restaurant_id IS NOT NULL 
    THEN votes.restaurant_id ELSE vetoes.restaurant_id END,
    CASE WHEN votes.name IS NOT NULL
    THEN votes.name ELSE vetoes.name END,
    CASE WHEN votes.votes IS NOT NULL 
    THEN CAST(votes.votes AS int) 
    ELSE CAST(0 AS int) END AS votes, 
    CASE WHEN vetoes.vetoes > 0 
    THEN true ELSE false END AS vetoed 
      FROM (
        (SELECT restaurant_id, name, count(upvoted) AS votes 
        FROM votes WHERE roomuniqueid = '${roomID}' AND upvoted = true 
        GROUP BY restaurant_id, roomuniqueid, name) votes 
        FULL JOIN 
            (SELECT restaurant_id, name, count(upvoted) AS vetoes 
            FROM votes 
            WHERE roomuniqueid = '${roomID}' 
            AND upvoted = false 
            GROUP BY restaurant_id, roomuniqueid, name) vetoes 
        ON votes.restaurant_id = vetoes.restaurant_id);`;
  db.sequelize.query(sqlQuery).spread((results) => {
    console.log('GET VOTES', results);
    callback(null, results);
  });
};

const addWin = (rest, room) => {
  db.models.Vote
    .findOne({
      where: {
        roomuniqueid: room,
        restaurant_id: rest,
        nominator: {[sequelize.Op.ne]: 'undefined'}
      },
      attributes: ['nominator']
    })
    .then((res) => {
      let nom = res.dataValues.nominator;
      db.models.User
        .increment(
          'wins', {
            where: {email: nom} 
        });
    })
    .catch((err) => {
      console.log('Error incrementing wins: ', err);
    })
}

const saveWinner = (roomId, callback) => {
  console.log('SAVING WINNER FOR: ', roomId);
  db.models.Vote
    .findAll({
      where: {roomuniqueid: roomId, upvoted: true},
      attributes: ['restaurant_id', 'roomuniqueid',
        [sequelize.fn('count', sequelize.col('upvoted')), 'votes']],
      group: ['restaurant_id', 'roomuniqueid'],
      order: [['count', 'DESC']]
    })
    .then((res) => {
      let restId = res[0].dataValues.restaurant_id;
      let roomId = res[0].dataValues.roomuniqueid;
      addWin(restId, roomId);
      db.models.Room
        .update({
          winningrestaurant: restId
        }, {
          where: {uniqueid: roomId},
          returning: true,
          plain: true
        })
    })
    .catch((err) => {
      console.log('Error Saving Winner', err);
    });
};

const getWinner = (roomId, callback) => {
  console.log('GETTING WINNER FOR: ', roomId);
  db.models.Room
    .findOne({
      where: {uniqueid: roomId},
      attributes: ['winningrestaurant']
    })
    .then((res) => {
      callback(res.dataValues.winningrestaurant);
    })
    .catch((err) => {
      console.log('Error Fetching Winner: ', err);
    })
};

module.exports = {
  saveMember,
  saveRoomAndMembers,
  getRoomMembers,
  saveRestaurant,
  saveCurrentRestaurant,
  getCurrentRestaurant,
  updateVotes,
  updateVetoes,
  getScoreboard,
  saveMessage,
  getMessages,
  getRooms,
  saveWinner,
  getWinner,
  getWins
};
