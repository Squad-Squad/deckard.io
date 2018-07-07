const db = require('../database-postgresql/models');
const bcrypt = require('bcrypt');
const _ = require('underscore')

// db.sequelize.query('SELECT * FROM users').spread((results) => {
//   console.log('AAAAAAAAAAAAAAA', results[0]);
// })

//
// ─── USER TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMember = (username, email, password, isGoogle, callback) => {
  let hashedPW;
  if (password) {
    const salt = bcrypt.genSaltSync(3);
    hashedPW = bcrypt.hashSync(password, salt);
  }
  db.models.User.create({
    username,
    email,
    password: hashedPW,
    is_google_account: isGoogle,
  })
    .then((result) => {
      callback(result);
    })
    .catch((error) => {
      console.log(error);
    });
};

const saveRoomAndMembers = (roomName, members, id, callback) => {
  members.push('mitsuku@mitsuku.com');

  const promisedMembers = members.map(memberEmail => db.models.User.findOne({
    where: {
      email: memberEmail,
    },
  }));
  let foundUsers = [];
  let newRoom = '';

  // User aliases
  const aliases = ['HAL 9000',
    'Android 18',
    'AM',
    'Marvin',
    'Roy Batty',
    'Pris',
    'Rachael',
    'C-3PO',
    'Ash',
    'T-800',
    'T-1000',
    'Data',
    'Bishop',
    'Johnny 5',
    'Robocop',
    'Rosie',
    'Cortana',
    'HK-47',
    '2B',
    'GlaDOS',
    'SHODAN',
    'Dolores'];

  Promise.all(promisedMembers)
    .then((users) => {
      foundUsers = users;
      return db.models.Room.findOrCreate({
        where: {
          name: roomName,
          uniqueid: id,
        },
      });
    })
    .then((room) => {
      newRoom = room;
      const addUserPromises = [];
      foundUsers.forEach((user) => {
        // Associate rooms and add aliases
        const random = Math.floor(Math.random() * aliases.length);
        addUserPromises.push(room[0].addUser(user, { through: { alias: aliases[random] } }));
        aliases.splice(random, 1);
      });
      return Promise.all(addUserPromises);
    })
    .then((results) => {
      callback(null, newRoom, foundUsers);
    })
    .catch((error) => {
      console.log(error);
    });
};

const aliasMembers = (roomName, roomMode, members, callback) => {
  const aliases = ['HAL 9000',
    'Android 18',
    'AM',
    'Marvin',
    'Roy Batty',
    'Pris',
    'Rachael',
    'C-3PO',
    'Ash',
    'T-800',
    'T-1000',
    'Data',
    'Bishop',
    'Johnny 5',
    'Robocop',
    'Rosie',
    'Cortana',
    'HK-47',
    '2B',
    'GlaDOS',
    'SHODAN',
    'Dolores'];

  // const randomAlias = Math.floor(Math.random() * aliases.length);
  const randomForAI = Math.floor(Math.random() * aliases.length);
  const membersObj = { room: roomName, roomMode, 'mitsuku@mitsuku.com': aliases[randomForAI] };
  aliases.splice(randomForAI, 1);
  members.forEach((member) => {
    const randomAlias = Math.floor(Math.random() * aliases.length);
    membersObj[member] = aliases[randomAlias];
    aliases.splice(randomAlias, 1);
  });
  callback(membersObj);
};

const updateUser = (updateData) => {
  db.models.User.findOne({ username: updateData.username })
    .then((user) => {
      if (user) {
        if (updateData.username) user.updateAttributes({ username: updateData.username });
        if (updateData.email) user.updateAttributes({ email: updateData.email });
        if (updateData.imageURL) user.updateAttributes({ imageURL: updateData.imageURL });
      } else {
        console.log('ERROR UPDATING THE USER');
      }
    });
};


// Add Mitsuku user to table if she doesn't already exist
const addMitsuku = () => {
  db.models.User.findAll({ where: { email: 'mitsuku@mitsuku.com' } })
    .then((res) => {
      if (!res.length) {
        db.models.User.create({ username: 'Mitsuku', email: 'mitsuku@mitsuku.com' });
      }
    });
};

//
// ─── MESSAGE TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMessage = (user_id, name, message, roomID, callback) => {
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
    attributes: ['email', 'id'],
    include: [{
      model: db.models.Room,
      where: { uniqueid: roomID },
      attributes: ['name', 'id'],
      through: { attributes: [] },
    }],
  })
    // Get aliases, this code sucks, ugh
    .then((users) => {
      Promise.all(users.map(user => db.models.RoomUsers.findAll({
        attributes: ['alias'],
        where: {
          userId: user.id,
          roomId: user.rooms[0].id,
        },
      })))
        .then((res) => {
          const aliases = JSON.parse(JSON.stringify(res)).map(el => el[0]);
          callback(null, JSON.parse(JSON.stringify(users)).map((user, i) => Object.assign(user, aliases[i])));
        });
    })
    .catch((error) => {
      callback(error);
    });
};

const getRooms = (email, callback) => {
  const sqlQuery = `SELECT rooms.id AS room_id, rooms.uniqueid AS room_uniqueid, rooms.name AS room_name
    FROM room_users
    FULL JOIN rooms
    ON room_users.room_id = rooms.id
    WHERE room_users.user_id =
    (SELECT ID FROM users WHERE email = '${email}')
    ORDER BY rooms."createdAt" desc
    LIMIT 20;`;
  db.sequelize.query(sqlQuery).spread((results) => {
    console.log('ROOOOOOOOOOOOMS', results);
    callback(null, results);
  });
};

const getWins = (email, callback) => {
  db.models.User
    .findOne({
      where: { email },
      attributes: ['wins'],
    })
    .then((res) => {
      callback(null, `${res.dataValues.wins}`);
    });
};


const fetchRedisMessages = (client, socket, callback) => {
  console.log('SOCKET.ROOOM in the DBCONTROLLERS', socket.room);
  const outputArray = [];
  client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
    if (err) {
      console.log(err);
    } else {
      replies.forEach((reply) => {
        const msgObj = {};
        const incoming = JSON.parse(reply);
        for (const key in incoming) {
          msgObj.message = incoming[key];
          msgObj.name = key;
          msgObj.user_id = null;
        }
        outputArray.push(msgObj);
      });
      console.log('AM I GETTING A FULL ARRAY OF MESSAGES', outputArray);
      callback(outputArray);
    }
  });
};


const getRoomReady = (io, client, socket, data, rooms) => {
  // const user = socket.username;
  // client.rpush(
  //   `${socket.room}:membersList`,
  //   JSON.stringify({ [user]: socket.id }),
  //   (err, replies) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log('addToRoomMembers in redis', replies);
  //     }
  //   },
  // );

  // // notify everyone when someone has joined the room
  // const user_id = socket.username;
  // const name = socket.username;
  // const message = `${data.user} has joined the room!`;

  // client.rpush(
  //   `${socket.room}:messages`,
  //   JSON.stringify({ matrixOverLords: message }),
  // );

  // notify everyone when mitsuku's joined the room (but only with her alias)
  if (socket.roomMode === 'free') {
    if (rooms[socket.room].length === 2) {
      setTimeout(() => {
        // add mitsuku to the members list in redis
        client.rpush(
          `${socket.room}:membersList`,
          JSON.stringify({ mitsuku: 'mitsuku@mitsuku.com' }),
          (err, replies) => {
            console.log('mitsuku added to redis db', replies);
          },
        );

        // add a message to room messages in redis notifying that mitsuku has joined
        const mitMessage = `${data.mitsuku} has joined the room`;
        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ matrixOverLords: mitMessage }),
          (err, reply) => {
            console.log("I've pushed to redis:", reply);
          },
        );

        // fetch all the messages from redis right after adding mitsuku's joined room message
        fetchRedisMessages(client, socket, (result) => {
          io.sockets.in(socket.room).emit('chat', result);
        });
      }, Math.random() * 5000);
    }
  }


  let membersInRoom;
  let membersInvitedtoRoom;
  client.lrangeAsync(`${data.roomID}:membersList`, 0, -1)
  .then((replies) => {
   
      membersInRoom = replies.map(reply => JSON.parse(reply));

    client.lrange(`${data.roomID}:membersInvited`, 0, -1, (err, replies) => {
      if (err) {
        console.log(err);
      } else {
        membersInvitedtoRoom = replies;
        if (data.roomMode === 'round') {
          if (membersInRoom.length === membersInvitedtoRoom.length) {
            // PUSH MITSUKU TO ROOM'S MEMBERLIST IN REDIS

            client.rpush(
              `${data.roomID}:membersList`,
              JSON.stringify({ mitsuku: 'mitsuku@mitsuku.com' }),
              (err, replies) => {
                console.log('mitsuku added to redis db', replies);
              },
            );


            // ADD A MESSAGE TO ROOM MESSAGES IN REDIS NOTIFYING THAT MITSUKU HAS JOINED

            const mitMessage = `${data.mitsuku} has joined the room`;
            client.rpush(
              `${data.roomID}:messages`,
              JSON.stringify({ matrixOverLords: mitMessage }),
              (err, reply) => {
                console.log("I've pushed to redis:", reply);
              },
            );


            // FETCH AND EMIT ALL MESSAGES AFTER MITSUKU'S JOIN MESSAGE HAS PUSHED TO REDIS

            fetchRedisMessages(client, socket, (result) => {
              io.sockets.in(data.roomID).emit('chat', result);
            });
            membersInRoom.push({ mitsuku: 'mitsuku@mitsuku.com' });


            // RANDOMIZE THE ORDER OF TURNS FOR ROUNDROBIN MODE

            const shuffledOrder = _.shuffle(membersInRoom);
            console.log('SHUFFLED ORDER FOR PLAY:', shuffledOrder);
            rooms[data.roomID].gameOrder = shuffledOrder;


            // WHEN ITS MITSUKU'S TURN

            if (Object.keys(shuffledOrder[0])[0] === 'mitsuku') {
              const key = Object.keys(shuffledOrder[1]);
              const fixKey = key[0];
              console.log('KEY2', key, 'FIXKEY2', fixKey);
              const firstTurnSocketId = shuffledOrder[1][fixKey];
              console.log('firstTurnSocketId:', firstTurnSocketId);
              io.sockets.sockets[firstTurnSocketId].emit('yourTurn', true);
            } else {
              const key = Object.keys(shuffledOrder[0]);
              const fixKey = key[0];
              console.log('KEY', key, 'FIXKEY', fixKey);
              const firstTurnSocketId = shuffledOrder[0][fixKey];
              console.log('firstTurnSocketId:', firstTurnSocketId);
              io.sockets.sockets[firstTurnSocketId].emit(
                'yourTurn',
                key[0],
              );
            }

            io.sockets.in(data.roomID).emit('roomReady', true);
          }
        }
      }
    });

  });

}



module.exports = {
  saveMember,
  saveRoomAndMembers,
  updateUser,
  getRoomMembers,
  addMitsuku,
  saveMessage,
  getMessages,
  getRooms,
  getWins,
  aliasMembers,
  fetchRedisMessages,
  getRoomReady,
};
