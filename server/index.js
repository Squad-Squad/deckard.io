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
const bluebird = require('bluebird');
const Mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET,
);
const db = require('../database-postgresql/models/index');
const dbHelpers = require('../db-controllers');
const { sequelize } = require('../database-postgresql/models/index');

const { Op } = db;

var timerObj = {};


//
// ─── REDIS ──────────────────────────────────────────────────────────────────────
//


const redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);


if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL);
} else {
  client = redis.createClient();
}

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
auth.passportHelper(passport);
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
  client.lremAsync('onlineUsers', 0, req.user, (err, reply) => {
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

  const { roomName, roomMode, members, roomLength } = req.body;
  const roomUnique = uniqueString().slice(0, 6);
  if(roomMode === "free"){
    timerObj[roomUnique] = new Tock({
      countdown: true,
    });
    let roomLengthInMilis = roomLength * 60 * 1000
    timerObj[roomUnique].start(roomLengthInMilis);
  }

  dbHelpers.aliasMembers(roomName, roomMode, members, roomLength, roomUnique, (results) => {
    client.hmset(`${roomUnique}:members`, results, (err, reply)=>{
      if(err){
        console.error(err)
      }else{
        res.send(results)
        client.expire(`${roomUnique}:members`, 3600)
      }
    });
  });

});


app.post('/api/saveFreeMode', (req, res) => {

  const {
    roomName, roomMode, members, roomLength,
  } = req.body;
  const roomUnique = uniqueString().slice(0, 6);
  timerObj[roomUnique] = new Tock({
    countdown: true,
  });

  dbHelpers.aliasMembers(roomName, roomMode, members, roomLength, roomUnique, (results) =>{
    client.hmset(`${roomUnique}:members`, results, (err, reply)=>{
      if(err){
        console.error(err)
      }else{
        res.send(results)
        client.expire(`${roomUnique}:members`, 3600)
      }
    });
  });


  // CHANGE THE ROOM TIMER LENGTH HERE

  let roomLengthInMilis = roomLength * 60 * 1000

  timerObj[roomUnique].start(roomLengthInMilis);


  // dbHelpers.saveRoomAndMembers(
  //   roomName,
  //   members,
  //   roomUnique,
  //   (err, room, users) => {
  //     if (err) {
  //       console.log('Error saving room and members', err);
  //     } else {
  //       res.send(room[0].dataValues);
  //     }
  //   },
  // );
});


app.post('/api/startTimer', (req, res) => {
  const { roomID, roomLength } = req.body;
  console.log('ROOOM ID IN START TIME API CALLL:', roomID);
  timerObj[roomID] = new Tock({
    countdown: true,
  });

  let roomLengthInMilis = roomLength * 60 * 1000
  console.log("+++++++ROOMLENGTHIN MILIS++++++", roomLengthInMilis)
  timerObj[roomID].start(roomLengthInMilis);

});

// Get room members here
app.get('/api/rooms/:roomID', (req, res) => {
  const { roomID } = req.params;

  client.hgetallAsync(`${roomID}:members`)
    .then((replies) => {
      console.log('REPLIES', replies);
      res.send(replies);
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
      console.log('++++++USERNAME CONNECT++++++:', data);

      client.lremAsync('onlineUsers', 0, socket.username)
        .then((reply) => {
          console.log(socket.username, 'removed before adding', reply);
        })
        .catch((err) => {
          console.error(err);
        });

      client.rpushAsync('onlineUsers', socket.username)
        .then((reply) => {
          console.log('userAdded to onlineUsers', reply);
        })
        .catch((err) => {
          console.error(err);
        });
      userSockets[socket.username] = socket;
    });

    socket.on('join', (data) => {
      socket.room = data.roomID;
      socket.alias = data.user;
      socket.roomMode = data.roomMode;
      socket.roomLength = data.roomLength
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

      // const user = socket.username;

      const user = socket.username;
      client.rpushAsync(
        `${socket.room}:membersList`,
        JSON.stringify({ [user]: socket.id }),
      )
        .then((reply) => {
          console.log('user pushed to room in redis', reply);
        })
        .catch((err) => {
          console.error(err);
        });

      // SET 1 HOUR EXPIRATION ON MEMBERSLIST DATA FOR THIS ROOM
      client.expire(`${socket.room}:membersList`, 3600);

      // NOTIFY EVERYONE WHEN SOMEONE HAS JOINED THE ROOM
      const user_id = socket.username;
      const name = socket.username;
      const message = `${data.user} has joined the room!`;

      client.rpush(
        `${socket.room}:messages`,
        JSON.stringify({ matrixOverLords: message }),
      );

      // SET 1 HOUR EXPIRATION ON MESSAGE DATA FOR THIS ROOM
      client.expire(`${socket.room}:messages`, 3600);

       console.log("STATE OF DATAAAA HEREEEE:", data)

      dbHelpers.getRoomReady(io, timerObj, client, socket, data, rooms);

      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(socket.room).emit('chat', result);
      });
    });


    socket.on('turn done', async data => {
    
      let gameOrderArr = [];
       await client.lrangeAsync(`${socket.room}:gameOrder`, 0, -1)
        .then((reply) => {
          reply.forEach(user=>{
            gameOrderArr.push(JSON.parse(user))
          })
        })
        .catch((err) => {
          console.error(err);
        });

      turnOverLogic(client, socket, data, gameOrderArr)

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
        io.sockets.sockets[socket.id].emit('turnOver', socket.username);
        io.sockets.emit('whose turn', 'mitsuku@mitsuku.com');

        let extraDelay = 0;
        let response;
        mitsuku.send(data.message).then((reply) => {
          response = reply
          if (response === undefined) {
            mitsuku.send(data.message).then((reply) => {
              response = reply
            });
          }
          if (/here\sin\sleeds/g.test(response)) {
            response = response.slice(0, response.indexOf('here in leeds'));
          }
          // Add delay based on response length
          extraDelay = response.length * 40;
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
            if(nextTurnUserSocketId){
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
        console.log('NEXT TURN data.USER SOCEKT ID:', nextTurnUserSocketId);
        io.sockets.sockets[nextTurnUserSocketId].emit('yourTurn', true);
        console.log('socket.id in next turn', socket.id);
        io.sockets.sockets[socket.id].emit('turnOver', socket.username);
        io.sockets.emit('whose turn', nextTurnUsername);
      }

      
    });

    // console.log("A DIFFERENT METHOD INDEX", rooms[socket.room]['gameOrder'].indexOf({[data.user]:socket.id}))


    socket.on('invite', (data) => {
      data.users.forEach((user) => {
        client.rpush(`${data.roomHash}:membersInvited`, user, (err, reply) => {
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

      // console.log('ROOMMODE WITH CHAT:', roomMode);

      // push all the messages sent from client to redis room key message list
      client.rpush(
        `${socket.room}:messages`,
        JSON.stringify({ [user]: message }),
      );

      // Change Mitsuku's response frequency based on the number of room users


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

      client.hgetallAsync(`${data.roomID}:members`)
      .then(replies => { 
        console.log('GET MEMBERS INFO IN DECLINE SOCKET', replies)
        dbHelpers.getRoomReady(io, timerObj, client, socket, data, rooms, replies);

        });

      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(data.roomID).emit('chat', result);
      });
    });

    // handle cases in which player leaves the room without completely disconnecting from the site
    socket.on('leaveRoom', (data) => {
      if (socket.room){
        rooms[socket.room].splice(rooms[socket.room].indexOf(socket.username),1 );

        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }),
        );

        console.log('SOCKET ID WHEN LEAVE:', socket.id);
        io.sockets.sockets[socket.id].emit('return option', socket.room, (err, response) => {
          console.log('DID I HAPPEN');
        });

        dbHelpers.removeFromMembersList(client, socket, rooms);


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
        console.log('this users has disconnected:', socket.username, 'AND ROOMS[SOCKET.ROOM] AFTER DISCONNECT:', rooms[socket.room]);
        client.rpush(
          `${socket.room}:messages`,
          JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }),
        );
      }

      client.lremAsync('onlineUsers', 1, socket.username)
        .then((replies) => {
          client.lrangeAsync('onlineUsers', 0, -1)
            .then((reply) => {
              console.log('ONLINE USERS CHECK AFTER REM:', reply);
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          console.error(err);
        });

      dbHelpers.removeFromMembersList(client, socket, rooms);

      dbHelpers.fetchRedisMessages(client, socket, (result) => {
        io.sockets.in(socket.room).emit('chat', result);
      });

      connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('vote', (data) => {
      console.log('SOCKET.ROOM in vote socket:', socket.room, 'and the rooms object:', rooms, 'and data.roomID', data.roomID);
      const userVotes = data.user;
      let roomMembers;
      let roomScores;
      // rooms[data.roomID][0][userVotes] = data.votes;

      client.rpush(`${data.roomID}:votes`, JSON.stringify({ [userVotes]: data.votes }), (err, replies) => {
        console.log('added users votes to redis', replies);
      });

      client.lrangeAsync(`${data.roomID}:votes`, 0, -1)
        .then((replies) => {
          const retrieveBucket = [];
          for (reply of replies) {
            retrieveBucket.push(JSON.parse(reply));
          }
          roomScores = retrieveBucket;
          client.lrangeAsync(`${data.roomID}:membersList`, 0, -1)
            .then((replies) => {
              roomMembers = replies;

              // DETERMINE IF EVERYONE HAS SUBMITTED THER VOTES

              if (roomMembers.length - 1 <= roomScores.length) {
                gameLogic.calcScores(roomScores)
                  .then((scoresArr) => {
                    console.log('SCOREARR IN SERVER:', scoresArr);
                    const [scores, winners] = scoresArr;

                    console.log('OUR RETURNED GOODSSSS', scores, winners);


                    if (winners.length > 1) {
                      for (var user of winners) {
                        db.models.User.findOne({ where: { username: user } })
                          .then((instance) => {
                            let prevGamesWon = instance.get('games_won');
                            instance.updateAttributes({
                              games_won: prevGamesWon += 1,
                            });
                          });
                      }
                    } else {
                      db.models.User.findOne({ where: { username: winners[0] } })
                        .then((instance) => {
                          let prevGamesWon = instance.get('games_won');
                          instance.updateAttributes({
                            games_won: prevGamesWon += 1,
                          });
                        });
                    }

                    for (var user in scores) {
                      db.models.User.findOne({ where: { username: user } })
                        .then((instance) => {
                          const oldScore = instance.get('lifetime_score');
                          let prevGamesPlayed = instance.get('games_played');
                          if (!isNaN(scores[user])) {
                            instance.updateAttributes({
                              lifetime_score: oldScore + scores[user],
                              games_played: prevGamesPlayed += 1,
                            });
                          }
                        });
                    }

                    io.sockets.in(socket.room).emit('scores', scores);
                  });
              }
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          console.error(err);
        });
    });
  });
});

// let timerObj = {};
