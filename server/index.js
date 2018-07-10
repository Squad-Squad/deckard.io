require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('flash');
const auth = require('../lib/auth');
const morgan = require('morgan');
const socket = require('socket.io');
const uniqueString = require('unique-string');
const Tock = require('tocktimer');
const mitsuku = require('../lib/mitsukuHelper')();
const gameLogic = require('../lib/gameLogic');
const _ = require('underscore');
const Mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET,
);
const db = require('../database-postgresql/models/index');
const dbHelpers = require('../db-controllers');
const { sequelize } = require('../database-postgresql/models/index');

const { Op } = db;

//
// ─── REDIS ──────────────────────────────────────────────────────────────────────
//
const redis = require('redis');

let client;
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL);
} else {
  client = redis.createClient();
}
const multi = client.multi();

//
// ─── AWS CONFIG ─────────────────────────────────────────────────────────────────
//
const AWS = require('aws-sdk');
const multer = require('multer');

AWS.config.update({
  accessKeyId: 'AKIAILGRIDM2NALR2ELA',
  secretAccessKey: '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',
});

const upload = multer({
  storage: multer.memoryStorage(),
});
const s3 = new AWS.S3();
const s3Params = {

  Bucket: 'deckard-io',
  Key: `userAvatars/${Date.now()}`,

};

//
// ─── EXPRESS MIDDLEWARE ─────────────────────────────────────────────────────────
//
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/../react-client/dist`));
app.use(morgan('dev'));

//
// ─── AUTHENTICAITON MIDDLEWARE ──────────────────────────────────────────────────
//
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: (24 * 60 * 60 + 1) * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
auth.passportHelper(passport, client);
app.use(flash());

// Add Mitsuku to DB if she doesn't exist
dbHelpers.addMitsuku();

//
// ─── GOOGLE OAUTH ENDPOINTS ─────────────────────────────────────────────────────
//
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    ],
  }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  },
);

//
// ─── LOCAL AUTH ENDPOINTS ───────────────────────────────────────────────────────
//
app.get('/checklogin', (req, res) => {
  res.status(200).send(req.session.passport);
});

app.post('/subscribe', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureFlash: true,
}));

app.post(
  '/login',
  passport.authenticate('local-login', {
    successRedirect: '/',
    failureFlash: true,
  }),
);

app.get('/logout', (req, res) => {
  client.lrem('onlineUsers', 0, req.user, (err, reply) => {
    console.log('removed before adding');
  });
  req.logout();
  res.redirect('/');
});

//
// ─── USER PROFILE ENDPOINTS ─────────────────────────────────────────────────────
//
app.post('/api/userInfo', (req, res) => {
  db.models.User.findOne({ where: { username: req.body.user } })
    .then((user) => {
      res.send(JSON.parse(JSON.stringify(user)));
    });
});

app.post('/profile/update-profile', upload.single('avatar'), (req, res) => {
  if (req.file) {
    s3Params.Body = req.file.buffer;
    s3.upload(s3Params, (err, data) => {
      if (err) console.log('Error uploading image to S3', err);
      if (data) {
        console.log('Successfully saved image to S3', data);

        db.models.User.findOne({ where: { username: req.body.username } })
          .then((user) => {
            user.update({
              username: req.body.newusername || user.dataValues.username,
              email: req.body.newemail || user.dataValues.email,
              description: req.body.newdescription || user.dataValues.description,
              avatar: data.Location,
            });

            res.status(200).send(data.Location);
          });
      }
    });
  } else {
    db.models.User.findOne({ where: { username: req.body.username } })
      .then((user) => {
        console.log('GETTING USER');
        user.update({
          username: req.body.newusername || user.dataValues.username,
          email: req.body.newemail || user.dataValues.email,
          description: req.body.newdescription || user.dataValues.description,
        });

        res.status(200).send();
      });
  }
});

app.post('/profile/add-friend', async (req, res) => {
  const friend = await db.models.User.findOne({ where: { username: req.body.friend } });
  const user = await db.models.User.findOne({ where: { username: req.body.username } });
  if (friend &&
  !user.dataValues.friends.includes(req.body.friend)) {
    await db.models.User.update(
      { friends: sequelize.fn('array_append', sequelize.col('friends'), req.body.friend) },
      { where: { username: req.body.username } },
    );
    res.status(200).send();
  } else if (user.dataValues.friends.includes(req.body.friend)) {
    console.log('ERROR');
    res.send('You\'re already friends with that user.');
  } else {
    res.send('That user does not exist.');
  }
});


//
// ─── USER SEARCH AND INVITE ─────────────────────────────────────────────────────
//
app.post('/searchUsers', (req, res) => {
  client.lrange('onlineUsers', 0, -1, (err, users) => {
    console.log('DESE DA ONLINE USERS', users);
    res.status(200).send(users);
  });
});

//
// ─── SERVE EMAIL INVITATIONS ────────────────────────────────────────────────────
//
app.post('/api/signupEmail', (req, res) => {
  console.log('Received request to send email to', req.body.email);
  const { email } = req.body;
  const emailData = {
    FromEmail: 'd3ck4rd.io@gmail.com',
    FromName: 'deckard.io',
    Subject: "You've been invited to deckard.io!",
    'Text-part': `You've been invited to play deckard.io -- visit ${process.env
      .DOMAIN || 'http://localhost:3000/'}signup to signup.`,
    Recipients: [{ Email: email }],
  };
  Mailjet.post('send')
    .request(emailData)
    .then(() => {
      res.end('Email sent!');
    })
    .catch((err) => {
      console.log('Error in interacting with the MailJet API', err);
      res.status(404).end();
    });
});

app.post('/api/roomEmail', (req, res) => {
  console.log('Received request to send email to', req.body);
  const { email, roomInfo } = req.body;
  const emailData = {
    FromEmail: 'd3ck4rd.io@gmail.com',
    FromName: 'deckard.io',
    Subject: "You've been invited to join a deckard.io room!",
    'Text-part': `You've been invited to a deckard.io room. Visit ${process.env
      .DOMAIN || 'http://localhost:3000/'}rooms/${roomInfo.uniqueid} to join.`,
    Recipients: [{ Email: email }],
  };
  Mailjet.post('send')
    .request(emailData)
    .then(() => {
      res.end('Email sent!');
    })
    .catch((err) => {
      console.log('Error in interacting with the MailJet API', err);
      res.status(404).end();
    });
});

//
// ─── CREATE ROOMS AND GET ROOM INFO ─────────────────────────────────────────────
//
app.post('/api/save', (req, res) => {
  console.log('NEW ROOM DATA', req.body);

  const { roomName, roomMode, members } = req.body;
  const roomUnique = uniqueString().slice(0, 6);
  timerObj[roomUnique] = new Tock({
    countdown: true,
  });

  dbHelpers.aliasMembers(roomName, roomMode, members, (results) => {
    client.hmset(`${roomUnique}:members`, results);
  });

  // CHANGE THE ROOM TIMER LENGTH HERE
  timerObj[roomUnique].start(40000);

  dbHelpers.saveRoomAndMembers(
    roomName,
    members,
    roomUnique,
    (err, room, users) => {
      if (err) {
        console.log('Error saving room and members', err);
      } else {
        console.log(`Saved room: ${roomName}`);
        res.send(room[0].dataValues);
      }
    },
  );
});

// Get room members here
app.get('/api/rooms/:roomID', (req, res) => {
  const { roomID } = req.params;

  client.hgetall(`${roomID}:members`, (err, replies) => {
    if (err) {
      console.log(err);
    } else {
      res.send(replies);
    }
  });
});

app.get('/api/timer/:roomID', (req, res) => {
  const { roomID } = req.params;
  res.send({ timeLeft: timerObj[roomID].lap() });
});

app.post('/room-redirect', (req, res) => {
  res.redirect(307, `/rooms/${req.body.id}`);
});

app.post('/api/userrooms', (req, res) => {
  const { username } = req.body;
  dbHelpers.getRooms(username, (err, rooms) => {
    if (err) {
      console.log('Error getting rooms', err);
    } else {
      res.send(rooms);
    }
  });
});

app.get('/verify/:hashID', (req, res) => {

  const { hashID } = req.params
  let hashExists = false

  client.get(hashID, (err, username) => {
    if (err) {
      console.log(err);
    } else {
      dbHelpers.setVerified(username)
      console.log("USERNAME ", username);
      res.redirect('/');
    }
  })
  // client.hgetall(`${roomID}:members`, (err, replies) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.send(replies);
  //   }
  // });
});

// ────────────────────────────────────────────────────────────────────────────────

// Sets up default case so that any URL not handled by the Express Router
// will be handled by the React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(`${__dirname}/../react-client/dist/index.html`));
});

// create the tables based on the models and once done, listen on the given port
db.models.sequelize.sync().then(() => {
  const server = app.listen(process.env.PORT || 3000, () => {
    console.log('listening on port', process.env.PORT || 3000);
  });

  // Server-side socket events
  const users = [];
  const rooms = {};
  const connections = [];
  const userSockets = {};

  const io = socket(server);
  io.on('connection', (socket) => {
    socket.on('username connect', (data) => {
      socket.username = data;
      console.log('USERNAME CONNECT:', data);

      client.lrem('onlineUsers', 0, socket.username, (err, reply) => {
        console.log(socket.username, 'removed before adding');
      });

      client.rpush('onlineUsers', socket.username, (err, reply) => {
        console.log('ONLINE USERS ADD:', reply);
      });

      userSockets[socket.username] = socket;
    });

    socket.on('join', (data) => {
      socket.room = data.room;
      socket.alias = data.user;
      socket.roomMode = data.roomMode;
      console.log(
        'JOIN ROOM IN SOCKETRS:',
        socket.room,
        socket.alias,
        socket.id,
        'AND ROOM MODE:',
        socket.roomMode,
      );

      if (!rooms[socket.room]) {
        rooms[socket.room] = [{}, socket.username];
      } else {
        rooms[socket.room].push(socket.username);
      }

      // actually join the socket namespace
      socket.join(socket.room);

      const user = socket.username;

      client.rpush(
        `${socket.room}:membersList`,
        JSON.stringify({ [user]: socket.id }),
        (err, replies) => {
          if (err) {
            console.log(err);
          } else {
            console.log('addToRoomMembers in redis', replies);
          }
        },
      );

      // notify everyone when someone has joined the room
      const user_id = socket.username;
      const name = socket.username;
      const message = `${data.user} has joined the room!`;

      client.rpush(
        `${socket.room}:messages`,
        JSON.stringify({ matrixOverLords: message }),
      );

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
            dbHelpers.fetchRedisMessages(client, socket, (result) => {
              io.sockets.in(socket.room).emit('chat', result);
            });
          }, Math.random() * 5000);
        }
      }


      let membersInRoom;
      let membersInvitedtoRoom;
      client.lrange(`${socket.room}:membersList`, 0, -1, (err, replies) => {
        if (err) {
          console.log(err);
        } else {
          membersInRoom = replies.map(reply => JSON.parse(reply));
        }

        client.lrange(`${socket.room}:membersInvited`, 0, -1, (err, replies) => {
          if (err) {
            console.log(err);
          } else {
            membersInvitedtoRoom = replies;
            if (data.roomMode === 'round') {
              if (membersInRoom.length === membersInvitedtoRoom.length) {
                // PUSH MITSUKU TO ROOM'S MEMBERLIST IN REDIS

                client.rpush(
                  `${socket.room}:membersList`,
                  JSON.stringify({ mitsuku: 'mitsuku@mitsuku.com' }),
                  (err, replies) => {
                    console.log('mitsuku added to redis db', replies);
                  },
                );


                // ADD A MESSAGE TO ROOM MESSAGES IN REDIS NOTIFYING THAT MITSUKU HAS JOINED

                const mitMessage = `${data.mitsuku} has joined the room`;
                client.rpush(
                  `${socket.room}:messages`,
                  JSON.stringify({ matrixOverLords: mitMessage }),
                  (err, reply) => {
                    console.log("I've pushed to redis:", reply);
                  },
                );


                // FETCH AND EMIT ALL MESSAGES AFTER MITSUKU'S JOIN MESSAGE HAS PUSHED TO REDIS

                dbHelpers.fetchRedisMessages(client, socket, (result) => {
                  io.sockets.in(socket.room).emit('chat', result);
                });
                membersInRoom.push({ mitsuku: 'mitsuku@mitsuku.com' });


                // RANDOMIZE THE ORDER OF TURNS FOR ROUNDROBIN MODE

                const shuffledOrder = _.shuffle(membersInRoom);
                console.log('SHUFFLED ORDER FOR PLAY:', shuffledOrder);
                rooms[socket.room].gameOrder = shuffledOrder;


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

                io.sockets.in(socket.room).emit('roomReady', true);
              }
            }
          }
        });
      });


      // FETCH ALL MESSAGES FROM REDIS

      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(socket.room).emit('chat', result);
      });
    });


    socket.on('turn done', (data) => {
      console.log('TURN DONE for Me:', data.user, socket.room);
      console.log("I'm the room order", rooms[socket.room].gameOrder);
      const gameOrderArr = rooms[socket.room].gameOrder;
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

      console.log('NEXT TURN USERNAME IN TURN DONE:', nextTurnUsername);

      if (nextTurnUsername === 'mitsuku') {
        io.sockets.sockets[socket.id].emit('turnOver', socket.username);
        console.log('LAST MESSAGE that mitsuku will respond to:', data.message);
        let extraDelay = 0;
        mitsuku.send(data.message).then((response) => {
          console.log('GETTING MESSAGE BACKFIRST', response);
          if (response === undefined) {
            mitsuku.send(data.message).then((response) => {
              console.log('GETTING MESSAGE BACKSECOND', response);
              client.rpush(
                `${socket.room}:messages`,
                JSON.stringify({ 'mitsuku@mitsuku.com': response }),
              );
            });
          }
          if (/here\sin\sleeds/g.test(response)) {
            response = response.slice(0, response.indexOf('here in leeds'));
          }
          // Add delay based on response length
          extraDelay = response.length * 25;
          console.log('EXTRA DELAY', extraDelay);

          setTimeout(() => {
            // Save her message to redis
            client.rpush(
              `${socket.room}:messages`,
              JSON.stringify({ 'mitsuku@mitsuku.com': response }),
            );

            // and retrieve all the messages immediately after
            dbHelpers.fetchRedisMessages(client, socket, (result) => {
              io.sockets.in(socket.room).emit('chat', result);
            });

            // after mitsuku's turn onto the next one

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
            io.sockets.sockets[nextTurnUserSocketId].emit('yourTurn', true);
          }, Math.random() * 5000 + 2000 + extraDelay);
        });
      } else {
        if (lastTurnIndex === gameOrderArr.length - 1) {
          nextTurnUsername = Object.keys(gameOrderArr[0])[0];
          nextTurnUserSocketId = gameOrderArr[0][nextTurnUsername];
        } else {
          nextTurnUserSocketId = gameOrderArr[lastTurnIndex + 1][nextTurnUsername];
        }
        console.log('NEXT TURN data.USER SOCEKT ID:', nextTurnUserSocketId);
        io.sockets.sockets[nextTurnUserSocketId].emit('yourTurn', true);
        console.log('socket.id in next turn', socket.id);
        io.sockets.sockets[socket.id].emit('turnOver', socket.username);
      }
    });

    // console.log("A DIFFERENT METHOD INDEX", rooms[socket.room]['gameOrder'].indexOf({[data.user]:socket.id}))


    socket.on('invite', (data) => {
      data.users.forEach((user) => {
        console.log(
          'userINvites in socket',
          user,
          'and dataHash',
          data.roomHash,
        );
        client.rpush(`${data.roomHash}:membersInvited`, user, (err, reply) => {
          console.log('replies from membersInvited', reply);
        });
        client.lrange(
          `${data.roomHash}:membersInvited`,
          0,
          -1,
          (err, reply) => {
            console.log('updated members in membersInvited', reply);
          },
        );
      });

      // send invitation to all online users (whether they are invited or not is sorted on front end), except inviter

      socket.broadcast.emit('invitation', {
        users: data.users,
        roomHash: data.roomHash,
        roomName: data.roomName,
        host: socket.username,
        roomMode: data.roomMode,
      });
    });

    socket.on('chat', (data) => {
      const user = data.message.name;
      const message = data.message.message;
      const roomMode = data.roomMode;

      console.log('ROOMMODE WITH CHAT:', roomMode);

      // push all the messages sent from client to redis room key message list
      client.rpush(
        `${socket.room}:messages`,
        JSON.stringify({ [user]: message }),
      );

      // Change Mitsuku's response frequency based on the number of room users

      if (roomMode === 'round') {


      }


      let extraDelay = 0;
      if (roomMode === 'free') {
        if (Math.ceil(Math.random() * (data.numUsers - 1)) === data.numUsers - 1) {
        // Delay Mitsuku a random number of seconds
          mitsuku.send(data.message.message).then((response) => {
            console.log('GETTING MESSAGE BACK', response);
            if (/here\sin\sleeds/g.test(response)) {
              response = response.slice(0, response.indexOf('here in leeds'));
            }

            // Add delay based on response length
            extraDelay = response.length * 50;
            console.log('EXTRA DELAY', extraDelay);

            setTimeout(() => {
            // Save her message to redis
              client.rpush(
                `${socket.room}:messages`,
                JSON.stringify({ 'mitsuku@mitsuku.com': response }),
              );

              // and retrieve all the messages immediately after
              dbHelpers.fetchRedisMessages(client, socket, (result) => {
                io.sockets.in(socket.room).emit('chat', result);
              });
            }, Math.random() * 5000 + 2000 + extraDelay);
          });
        }
      }

      // retrieve all the messages from redis everytime a message is received
      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(socket.room).emit('chat', result);
      });
    });

    // handle cases in which an invitation to a room is declined, remove from membersinvited so when compared with who has joined
    // we know when to start the room
    socket.on('decline', (data) => {
      client.lrem(
        `${data.roomID}:membersInvited`,
        0,
        data.user,
        (err, reply) => {
          console.log('decline REPLIES', reply);
        },
      );
      client.lrange(`${data.roomID}:membersInvited`, 0, -1, (err, reply) => {
        console.log('updatedMembersInvitedList after decline:', reply);
      });

      let membersInRoomDECLINE;
      let membersInvitedtoRoomDECLINE;
      client.lrange(`${data.roomID}:membersList`, 0, -1, (err, replies) => {
        if (err) {
          console.log(err);
        } else {
          membersInRoomDECLINE = replies;
        }

        client.lrange(
          `${data.roomID}:membersInvited`,
          0,
          -1,
          (err, replies) => {
            if (err) {
              console.log(err);
            } else {
              membersInvitedtoRoomDECLINE = replies;
              if (data.roomMode === 'round') {
                if (
                  membersInRoomDECLINE.length >=
                  membersInvitedtoRoomDECLINE.length
                ) {
                  io.sockets.in(data.roomID).emit('roomReady', true);
                }
              }
            }
          },
        );
      });
    });

    // handle cases in which player leaves the room without completely disconnecting from the site
    socket.on('leaveRoom', (data) => {
      if (socket.room) {
        rooms[socket.room].splice(
          rooms[socket.room].indexOf(socket.username),
          1,
        );

        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }),
        );

        dbHelpers.fetchRedisMessages(client, socket, (result) => {
          io.sockets.in(socket.room).emit('chat', result);
        });
      }
    });

    socket.on('disconnect', (data) => {
      const thisRoom = rooms[socket.room];

      if (rooms[socket.room]) {
        users.splice(users.indexOf(socket.username), 1);
        rooms[socket.room].splice(thisRoom.indexOf(socket.username), 1);
        console.log(
          'this users has disconnected:',
          socket.username,
          'AND ROOMS[SOCKET.ROOM] AFTER DISCONNECT:',
          rooms[socket.room],
        );
        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }),
        );
      }

      client.lrem('onlineUsers', 1, socket.username, (err, replies) => {
        console.log(
          'WAS I REMOVED FROM REDIS WHEN I DISCONNECTED:',
          socket.username,
        );
        console.log('REMOVE REPLY', replies);
      });

      client.lrange('onlineUsers', 0, -1, (err, reply) => {
        console.log('ONLINE USERS CHECK:', reply);
      });

      socket.leave(socket.room);
      // console.log('SOCKET.ROOMS', rooms);

      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(socket.room).emit('chat', result);
      });

      connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('vote', (data) => {
      rooms[socket.room][0][data.user] = data.votes;

      // determine if everyone has submitted there votes
      if (rooms[socket.room].length - 1 === Object.keys(rooms[socket.room][0]).length) {
        const scores = gameLogic.calcScores(rooms[socket.room]);

        // add everyones scores to their lifetime scores in postgres db
        for (var user in scores) {
          db.models.User.findOne({ where: { username: user } }).then((instance) => {
            console.log('user in db', user);
            const oldScore = instance.get('lifetime_score');
            // console.log('OLD LIFETIME SCORE:', oldScore);
            console.log();
            instance.updateAttributes({
              lifetime_score: oldScore + scores[user],
            });
          });
        }

        io.sockets.in(socket.room).emit('scores', scores);
      }
    });
  });
});



let timerObj = {};
const nominateTimerObj = {};
