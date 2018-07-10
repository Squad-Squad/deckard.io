const db = require('../database-postgresql/models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
  ];

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
  ];

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
  // Joseph using SQL to get user's rooms
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
      callback(outputArray);
    }
  });
  // callback(outputArray)
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
};
