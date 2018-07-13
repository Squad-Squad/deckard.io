const db = require('../database-postgresql/models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const _ = require('underscore');
const Tock = require('tocktimer');


// db.sequelize.query('SELECT * FROM users').spread((results) => {
//   console.log('AAAAAAAAAAAAAAA', results[0]);
// })

//
// ─── USER TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMember = (
  username,
  email,
  password,
  isGoogle,
  isGithub,
  githubID,
  callback,
) => {
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
    is_github_account: isGithub,
    github_id: githubID,
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

  const promisedMembers = members.map(memberEmail =>
    db.models.User.findOne({
      where: {
        email: memberEmail,
      },
    }));
  let foundUsers = [];
  let newRoom = '';

  // User aliases
  const aliases = [
    'HAL 9000',
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
    'Dolores',
    'Joseph 0H'];

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

const aliasMembers = (roomName, roomMode, members, roomLength, roomUnique, callback) => {
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
    'Dolores',
  ];

  // const randomAlias = Math.floor(Math.random() * aliases.length);
  const randomForAI = Math.floor(Math.random() * aliases.length);
  const membersObj = {
    room: roomName, roomMode, roomLength, roomID: roomUnique, 'mitsuku@mitsuku.com': aliases[randomForAI],
  };
  aliases.splice(randomForAI, 1);
  members.forEach((member) => {
    const randomAlias = Math.floor(Math.random() * aliases.length);
    membersObj[member] = aliases[randomAlias];
    aliases.splice(randomAlias, 1);
  });
  callback(membersObj);
};

const updateUser = (updateData) => {
  db.models.User.findOne({ username: updateData.username }).then((user) => {
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
  db.models.User.findAll({ where: { email: 'mitsuku@mitsuku.com' } }).then((res) => {
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
    include: [
      {
        model: db.models.Room,
        where: { uniqueid: roomID },
        attributes: [],
      },
    ],
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
    include: [
      {
        model: db.models.Room,
        where: { uniqueid: roomID },
        attributes: ['name', 'id'],
        through: { attributes: [] },
      },
    ],
  })
    // Get aliases, this code sucks, ugh
    .then((users) => {
      Promise.all(users.map(user =>
        db.models.RoomUsers.findAll({
          attributes: ['alias'],
          where: {
            userId: user.id,
            roomId: user.rooms[0].id,
          },
        }))).then((res) => {
        const aliases = JSON.parse(JSON.stringify(res)).map(el => el[0]);
        callback(
          null,
          JSON.parse(JSON.stringify(users)).map((user, i) => Object.assign(user, aliases[i])),
        );
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
  db.models.User.findOne({
    where: { email },
    attributes: ['wins'],
  }).then((res) => {
    callback(null, `${res.dataValues.wins}`);
  });
};

const fetchRedisMessages = (client, socket, callback) => {
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
      callback(outputArray);
    }
  });
};


const getRoomReady = (io, timerObj, client, socket, data, rooms, membersInfo) => {
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

      client.lrangeAsync(`${data.roomID}:membersInvited`, 0, -1)
        .then((replies) => {
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
              // REMOVED FOR NOW BECAUSE MITSUKU IS ALWAYS ADDED LAST AND RANDOMIZING THIS MAY NOT BE WORTH IT
              // DON'T DELETE IN CASE WE WANT TO ADD IT BACK THOUGH


              // let mitMessage;
              // if(membersInfo){
              //   mitMessage = `${membersInfo['mitsuku@mitsuku.com']} has joined the room`
              // }else{
              //   mitMessage = `${data.mitsuku} has joined the room`
              // }


              // client.rpush(
              //   `${data.roomID}:messages`,
              //   JSON.stringify({ matrixOverLords: mitMessage }),
              //   (err, reply) => {
              //     console.log("I've pushed to redis:", reply);
              //   },
              // );


              // FETCH AND EMIT ALL MESSAGES AFTER MITSUKU'S JOIN MESSAGE HAS PUSHED TO REDIS

              // fetchRedisMessages(client, socket, (result) => {
              //   io.sockets.in(data.roomID).emit('chat', result);
              // });


              // RANDOMIZE THE ORDER OF TURNS FOR ROUNDROBIN MODE AND PUSH RESULTS TO REDIS

              membersInRoom.push({ mitsuku: 'mitsuku@mitsuku.com' });
              const shuffledOrder = _.shuffle(membersInRoom);

              shuffledOrder.forEach((player) => {
                client.rpushAsync(`${data.roomID}:gameOrder`, JSON.stringify(player))
                  .then(() => {
                    client.lrangeAsync(`${data.roomID}:gameOrder`, 0, -1)
                      .then((replies) => {
                        console.log('GAMEORDER LIST IN REDIS', replies);
                        client.expire(`${data.roomID}:gameOrder`, 3600);
                      });
                  });
              });


              // WHEN ITS MITSUKU'S TURN

              if (Object.keys(shuffledOrder[0])[0] === 'mitsuku') {
                const key = Object.keys(shuffledOrder[1]);
                const fixKey = key[0];
                const firstTurnSocketId = shuffledOrder[1][fixKey];
                io.sockets.in(data.room).emit('whose turn', fixKey);
                io.sockets.sockets[firstTurnSocketId].emit('yourTurn', key[0]);
                io.sockets.in(data.roomID).emit('roomReady', { roomLength: data.roomLength, firstTurn: firstTurnSocketId });
              } else {
                const key = Object.keys(shuffledOrder[0]);
                const fixKey = key[0];
                const firstTurnSocketId = shuffledOrder[0][fixKey];
                io.sockets.in(data.room).emit('whose turn', fixKey);
                io.sockets.sockets[firstTurnSocketId].emit('yourTurn', key[0]);
                io.sockets.in(data.roomID).emit('roomReady', { roomLength: data.roomLength, firstTurn: firstTurnSocketId });
              }
            }
          }
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
    });
};


const removeFromMembersList = (client, socket, rooms) => {
  const user = socket.username;
  // UPDATE GAME TURN ORDER WHEN SOMEONE LEAVES THE ROOM

  client.lremAsync(`${socket.room}:gameOrder`, 1, JSON.stringify({ [user]: socket.id }))
    .then((replies) => {
      client.lrangeAsync(`${socket.room}:gameOrder`, 0, -1)
        .then((reply) => {
          console.log(`GAMEORDER of ${socket.room} CHECK AFTER REM:`, reply);
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
    });

  client.lremAsync(`${socket.room}:membersList`, 1, JSON.stringify({ [user]: socket.id }))
    .then((replies) => {
      client.lrangeAsync(`${socket.room}:membersList`, 0, -1)
        .then((reply) => {
          console.log('MEMBERS LIST AFTER REMOVEFROMMEMBERSLIST:', reply);
          // client.rpush(
          //   `${socket.room}:messages`,
          //   JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }),
          // );

          // LEAVE ROOM ASYNCHRONOUSLY HERE
          socket.leave(socket.room);
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
    });
};

const saveVerificationHash = (client, hash, username) => {
  client.set(hash, username, 'EX', 86400); //  expires after 24 hours
};

const lookupVerificationHash = (client, hash, username) => {};

const setVerified = (username) => {
  db.models.User.findOne({
    where: { username },
  })
    .then((user) => {
      if (user) {
        user.updateAttributes({ is_verified: true });
        console.log('Verified User ', username);
      } else {
        console.log('Error updating user');
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

const hashUsername = (username) => {
  const secret = 'abcdefg';
  const hash = crypto
    .createHash('md5', secret)
    .update(username)
    .digest('hex');
  return hash;
};

const getUser = username =>
  db.models.User.findOne({ where: { username } })
    .then(user => user)
    .catch((err) => {
      console.log('ERROR getUser Function', err);
    });

const getUserEmail = username =>
  getUser(username)
    .then((user) => {
      const { email } = user.dataValues;
      return email;
    })
    .catch(err => console.log('error', err));


const turnOverLogic = (io, client, socket, data, gameOrderArr, mitsuku) => {
  console.log('IN TURNOVER LOGIC STATE OF DATA:', data, gameOrderArr);
  let message;
  if (!data.message) {
    message = 'goodbye***';
  } else {
    message = data.message;
  }

  const gameOrderArrOfKeys = [];
  let nextTurnUsername;
  let nextTurnUserSocketId;
  gameOrderArr.forEach((player) => {
    const username = Object.keys(player);
    gameOrderArrOfKeys.push(username[0]);
  });
  const lastTurnIndex = gameOrderArrOfKeys.indexOf(data.user);

  if (lastTurnIndex === gameOrderArr.length - 1) {
    nextTurnUsername = Object.keys(gameOrderArr[0])[0];
  } else {
    nextTurnUsername = Object.keys(gameOrderArr[lastTurnIndex + 1])[0];
  }


  if (nextTurnUsername === 'mitsuku') {
    // IF THIS ISN'T THE MESSAGE SENT WHEN SOMEONE LEAVES THE ROOM
    if (message !== 'goodbye***') {
      io.sockets.sockets[socket.id].emit('turnOver', socket.username);
    }

    io.sockets.emit('whose turn', 'mitsuku@mitsuku.com');

    let extraDelay = 0;
    let response;
    mitsuku.send(message).then((reply) => {
      response = reply;
      if (response === undefined) {
        mitsuku.send(message).then((reply) => {
          response = reply;
        });
      }
      if (/here\sin\sleeds/g.test(response)) {
        response = response.slice(0, response.indexOf('here in leeds'));
      }
      // Add delay based on response length
      extraDelay = response.length * 40;
      console.log('EXTRA DELAY', extraDelay);

      setTimeout(async () => {
        // SAVE HER MESSAGE TO REDIS
        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ 'mitsuku@mitsuku.com': response }),
        );

        // AND RETRIEVE ALL MESSAGES IMMEDIATELY AFTER
        fetchRedisMessages(client, socket, (result) => {
          io.sockets.in(socket.room).emit('chat', result);
        });

        // FETCH GAMEORDERARR AGAIN IN CASE SOMEONE LEAVES ROOM IN MIDDLE OF MITSUKU RESPONSE
        const gameOrderArr = [];
        await client.lrangeAsync(`${socket.room}:gameOrder`, 0, -1)
          .then((reply) => {
            reply.forEach((user) => {
              gameOrderArr.push(JSON.parse(user));
            });
          })
          .catch((err) => {
            console.error(err);
          });

        // AFTER MITSUKU'S TURN ONTO THE NEXT ONE

        if (lastTurnIndex + 1 === gameOrderArr.length - 1) {
          nextTurnUsername = Object.keys(gameOrderArr[0])[0];
          nextTurnUserSocketId = gameOrderArr[0][nextTurnUsername];
        } else if (nextTurnUsername === Object.keys(gameOrderArr[0])[0]) {
          nextTurnUsername = Object.keys(gameOrderArr[1])[0];
          nextTurnUserSocketId = gameOrderArr[1][nextTurnUsername];
        } else {
          nextTurnUsername = Object.keys(gameOrderArr[lastTurnIndex + 2])[0];
          nextTurnUserSocketId = gameOrderArr[lastTurnIndex + 2][nextTurnUsername];
        }
        if (nextTurnUserSocketId) {
          io.sockets.sockets[nextTurnUserSocketId].emit('yourTurn', true);
          io.sockets.emit('whose turn', nextTurnUsername);
        }
      }, Math.random() * 5000 + 2000 + extraDelay);
    });
  } else {
    if (lastTurnIndex === gameOrderArr.length - 1) {
      nextTurnUsername = Object.keys(gameOrderArr[0])[0];
      nextTurnUserSocketId = gameOrderArr[0][nextTurnUsername];
    } else {
      nextTurnUserSocketId = gameOrderArr[lastTurnIndex + 1][nextTurnUsername];
    }
    io.sockets.sockets[nextTurnUserSocketId].emit('yourTurn', true);
    console.log();
    if (message !== 'goodbye***') {
      io.sockets.sockets[socket.id].emit('turnOver', socket.username);
    }
    io.sockets.emit('whose turn', nextTurnUsername);
  }
};


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
  saveVerificationHash,
  lookupVerificationHash,
  setVerified,
  hashUsername,
  getUser,
  getUserEmail,
  getRoomReady,
  removeFromMembersList,
  turnOverLogic,
};
