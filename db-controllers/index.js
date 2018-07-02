const db = require('../database-postgresql/models');
const bcrypt = require('bcrypt');

// db.sequelize.query('SELECT * FROM users').spread((results) => {
//   console.log('AAAAAAAAAAAAAAA', results[0]);
// })

//
// ─── USER TABLE HELPERS ─────────────────────────────────────────────────────────
//
const saveMember = (email, password, callback) => {
  let hashedPW;
  if (password) {
    const salt = bcrypt.genSaltSync(3);
    hashedPW = bcrypt.hashSync(password, salt);
  }
  db.models.User.create({
    email,
    password: hashedPW,
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

const aliasMembers = (roomName, members, callback) => {
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
  const membersObj = { room: roomName, 'mitsuku@mitsuku.com': aliases[randomForAI] };
  aliases.splice(randomForAI, 1);
  members.forEach((member) => {
    const randomAlias = Math.floor(Math.random() * aliases.length);
    membersObj[member] = aliases[randomAlias];
    aliases.splice(randomAlias, 1);
  });
  callback(membersObj);
};


// Add Mitsuku user to table if she doesn't already exist
const addMitsuku = () => {
  db.models.User.findAll({ where: { email: 'mitsuku@mitsuku.com' } })
    .then((res) => {
      if (!res.length) {
        db.models.User.create({ email: 'mitsuku@mitsuku.com' });
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
  db.models.User
    .findOne({
      where: { email },
      attributes: ['wins'],
    })
    .then((res) => {
      callback(null, `${res.dataValues.wins}`);
    });
};

module.exports = {
  saveMember,
  saveRoomAndMembers,
  getRoomMembers,
  addMitsuku,
  saveMessage,
  getMessages,
  getRooms,
  getWins,
  aliasMembers,
};
