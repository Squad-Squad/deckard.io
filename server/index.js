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
  client = redis.createClient(process.env.REDIS_URL);
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
    scope: ['https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'],
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

app.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureFlash: true,
}));

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

app.post('/profile/add-friend', (req, res) => {
  db.models.User.update(
    { friends: sequelize.fn('array_append', sequelize.col('friends'), req.body.friend) },
    { where: { username: req.body.username } },
  )
    .then((results) => {
      res.status(200).send();
    });
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
    Subject: 'You\'ve been invited to deckard.io!',
    'Text-part': `You've been invited to play deckard.io -- visit ${process.env.DOMAIN || 'http://localhost:3000/'}signup to signup.`,
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
    Subject: 'You\'ve been invited to join a deckard.io room!',
    'Text-part': `You've been invited to a deckard.io room. Visit ${process.env.DOMAIN || 'http://localhost:3000/'}rooms/${roomInfo.uniqueid} to join.`,
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

  const { roomName, members } = req.body;
  const roomUnique = uniqueString().slice(0, 6);
  timerObj[roomUnique] = new Tock({
    countdown: true,
  });


  dbHelpers.aliasMembers(roomName, members, (results) => {
    client.hmset(`${roomUnique}:members`, results);
  });


  // CHANGE THE ROOM TIMER LENGTH HERE
  timerObj[roomUnique].start(20000);

  dbHelpers.saveRoomAndMembers(roomName, members, roomUnique, (err, room, users) => {
    if (err) {
      console.log('Error saving room and members', err);
    } else {
      console.log(`Saved room: ${roomName}`);
      res.send(room[0].dataValues);
    }
  });
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
        console.log('removed before adding');
      });

      client.rpush('onlineUsers', socket.username, (err, reply) => {
        console.log('ONLINE USERS ADD:', reply);
      });

      userSockets[socket.username] = socket;
      users.push(socket.username);
      console.log('USERS IN SERVER:', users);
    });

    socket.on('join', (data) => {
      socket.room = data.room;
      socket.alias = data.user;
      console.log('JOIN ROOM IN SOCKETRS:', socket.room, socket.alias);

      if (!rooms[socket.room]) {
        rooms[socket.room] = [{}, socket.username];
        console.log('ROOMS AFTER CREATION:', rooms);
      } else {
        rooms[socket.room].push(socket.username);
      }

      socket.join(socket.room);

      io.sockets.in(socket.room).emit('chat', {
        message: {
          user_id: socket.username,
          name: socket.username,
          message: `${data.user} has joined the room!`,
        },
        roomId: socket.room,
      });

      const user_id = socket.username;
      const name = socket.username;
      const message = `${data.user} has joined the room!`;

      client.rpush(`${socket.room}:messages`, JSON.stringify({ matrixOverLords: message }));

      client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
        if (err) {
          console.log(err);
        } else {
          const outputArray = [];

          replies.forEach((reply) => {
            // testArr.push(JSON.parse(reply))
            const msgObj = {};
            const incoming = JSON.parse(reply);
            for (const key in incoming) {
              msgObj.message = incoming[key];
              msgObj.name = key;
              msgObj.user_id = null;
            }
            outputArray.push(msgObj);
          });

          io.sockets.in(socket.room).emit('chat', outputArray);
        }
      });
    });


    socket.on('invite', (data) => {
      socket.broadcast.emit('invitation', {
        users: data.users, roomHash: data.roomHash, roomName: data.roomName, host: socket.username,
      });
    });

    socket.on('chat', (data) => {
      // console.log("CHAT IN SERVER SOCKET:", data)

      const user = data.message.name;
      const { message } = data.message;


      client.rpush(`${socket.room}:messages`, JSON.stringify({ [user]: message }));


      let extraDelay = 0;

      // Change Mitsuku's response frequency based on the number of room users
      if (Math.ceil(Math.random() * (data.numUsers - 1)) === (data.numUsers - 1)) {
        // Delay Mitsuku a random number of seconds
        mitsuku.send(data.message.message)
          .then((response) => {
            console.log('GETTING MESSAGE BACK', response);
            if (/here\sin\sleeds/g.test(response)) {
              response = response.slice(0, response.indexOf('here in leeds'));
            }

            // Add delay based on response length
            extraDelay = response.length * 50;
            console.log('EXTRA DELAY', extraDelay);

            setTimeout(() => {
              // Save her message to redis
              client.rpush(`${socket.room}:messages`, JSON.stringify({ 'mitsuku@mitsuku.com': response }));
              client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
                if (err) {
                  console.log(err);
                } else {
                  const outputArray = [];

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

                  io.sockets.in(socket.room).emit('chat', outputArray);
                }
              });
            }, Math.random() * 5000 + 2000 + extraDelay);
          });
      }


      client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
        if (err) {
          console.log(err);
        } else {
          const outputArray = [];

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

          io.sockets.in(socket.room).emit('chat', outputArray);
        }
      });
    });


    socket.on('leaveRoom', (data) => {
      if (socket.room) {
        rooms[socket.room].splice(rooms[socket.room].indexOf(socket.username), 1);
        console.log('AFTERLEAVING ROOMS OBJ', rooms[socket.room]);

        client.rpush(`${socket.room}:messages`, JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }));

        client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
          if (err) {
            console.log(err);
          } else {
            const outputArray = [];

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

            io.sockets.in(socket.room).emit('chat', outputArray);
          }
        });
      }
    });


    socket.on('disconnect', (data) => {
      const thisRoom = rooms[socket.room];
      console.log('this users has disconnected:', socket.username, 'AND ROOMS[SOCKET.ROOM]:', rooms[socket.room]);

      if (rooms[socket.room]) {
        users.splice(users.indexOf(socket.username), 1);
        rooms[socket.room].splice(thisRoom.indexOf(socket.username), 1);
        console.log('this users has disconnected:', socket.username, 'AND ROOMS[SOCKET.ROOM] AFTER DISCONNECT:', rooms[socket.room]);
      }

      client.rpush(`${socket.room}:messages`, JSON.stringify({ matrixOverLords: `${socket.alias} left the room` }));


      client.lrem('onlineUsers', 1, socket.username, (err, replies) => {
        console.log('REMOVE REPLY', replies);
      });

      client.lrange('onlineUsers', 0, -1, (err, reply) => {
        console.log('ONLINE USERS CHECK:', reply);
      });


      socket.leave(socket.room);
      console.log('SOCKET.ROOMS', rooms);


      client.lrange(`${socket.room}:messages`, 0, -1, (err, replies) => {
        if (err) {
          console.log(err);
        } else {
          const outputArray = [];

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

          io.sockets.in(socket.room).emit('chat', outputArray);
        }
      });


      connections.splice(connections.indexOf(socket), 1);
    });


    socket.on('vote', (data) => {
      rooms[socket.room][0][data.user] = data.votes;


      // determine if everyone has submitted there votes

      if (rooms[socket.room].length - 1 === Object.keys(rooms[socket.room][0]).length) {
        const scores = gameLogic.calcScores(rooms[socket.room]);

        for (var user in scores) {
          db.models.User.findOne({ where: { username: user } })
            .then((instance) => {
              console.log('user in db', user);
              const oldScore = instance.get('lifetime_score');
              // console.log('OLD LIFETIME SCORE:', oldScore);
              console.log();
              instance.updateAttributes({
                lifetime_score: oldScore + scores[user],
              });
            });
        }
      }


      db.models.Room.findOne({ where: { uniqueid: socket.room } })
        .then((room) => {
          // Check if record exists in db
          console.log('AND THE scores before they go IN DB:', scores);
          if (room) {
            room.updateAttributes({
              scores: JSON.stringify(scores),
            });
          }
        });
      io.sockets.in(socket.room).emit('scores', scores);
    });
  });
});

let timerObj = {};
const nominateTimerObj = {};
