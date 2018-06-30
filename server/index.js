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
const gameLogic = require('../lib/gameLogic')
const redis = require('redis')


const Mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET,
);

const db = require('../database-postgresql/models/index');
const dbHelpers = require('../db-controllers');

const { Op } = db;


const client = redis.createClient();
const multi = client.multi()

client.on('connect', function() {
  console.log('Connected to Redis');
});

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
}), (req, res) => {
  res.status(200).redirect('/');
});

app.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureFlash: true,
}));

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


//
// ─── USER SEARCH AND INVITE ─────────────────────────────────────────────────────
//
app.post('/searchUsers', (req, res) => {
  db.models.User.findAll()
    .then(matches => res.status(200).send(matches))
    .catch(err => res.status(200).send(err));
});


//
// ─── SERVE EMAIL INVITATIONS ────────────────────────────────────────────────────
//
app.post('/api/signupEmail', (req, res) => {
  console.log('Received request to send email to', req.body.email);
  const { email } = req.body;
  const emailData = {
    FromEmail: 'foodfightHR@gmail.com',
    FromName: 'Food Fight',
    Subject: 'You\'ve been invited to Food Fight!',
    'Text-part': `You've been invited to a Food Fight. Visit ${process.env.DOMAIN || 'http://localhost:3000/'}signup to signup.`,
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
    FromEmail: 'foodfightHR@gmail.com',
    FromName: 'Food Fight',
    Subject: 'You\'ve been invited to join a Food Fight room!',
    'Text-part': `You've been invited to a Food Fight room. Visit ${process.env.DOMAIN || 'http://localhost:3000/'}rooms/${roomInfo.uniqueid} to join.`,
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
  const roomUnique = uniqueString();
  timerObj[roomUnique] = new Tock({
    countdown: true,
  });

    for(var el of members){
      multi.rpush(roomUnique, el)
    }

    multi.exec(function(errors, results) {})

  // CHANGE THE ROOM TIMER LENGTH HERE
  timerObj[roomUnique].start(2000);

  dbHelpers.saveRoomAndMembers(roomName, members, roomUnique, (err, room, users) => {
    if (err) {
      console.log('Error saving room and members', err);
    } else {
      console.log(`Saved room: ${roomName}`);
      console.log('SAVED ROOM:', room, "AND USERS:", users)
      res.send(room[0].dataValues);
    }
  });
});

// Get room members here
app.get('/api/rooms/:roomID', (req, res) => {
  const { roomID } = req.params;

  client.lrange(roomID, 0, -1, (err, replies)=>{
    if(err){
      console.log(err)
    }else{
      console.log("REDIS ROOM MEMBERS RETRIEVE", replies)
      res.send(replies)
    }
  })

  dbHelpers.getRoomMembers(roomID, (err, roomMembers) => {
    if (err) {
      console.log('Error getting room members', err);
    } else {
      res.send(roomMembers);
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

// Joseph
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

app.post('/api/userwins', (req, res) => {
  const { username } = req.body;
  dbHelpers.getWins(username, (err, wins) => {
    if (err) {
      console.log('Error getting wins', err);
    } else {
      res.send(wins);
    }
  });
});

app.get('/api/getWinner/:roomID', (req, res) => {
  const { roomID } = req.params;
  dbHelpers.getWinner(roomID, (response) => {
    res.send(response);
  });
});


//
// ─── HANDLE MESSAGES AND VOTES─────────────────────────────────────────────────────────
//
app.post('/api/messages', (req, res) => {
  const { user_id, message, roomID } = req.body;
  dbHelpers.saveMessage(user_id, message.name, message.message, roomID, (err, savedMessage) => {
    if (err) {
      console.log('Error saving message', err);
      res.status(404).end();
    } else {
      res.end('Message saved', savedMessage);
    }
  });
});

app.get('/api/messages/:roomID', (req, res) => {
  const { roomID } = req.params;
  dbHelpers.getMessages(roomID, (err, fetchedMessages) => {
    if (err) {
      console.log('Error retrieving messages', err);
      res.status(404).end();
    } else {
      res.send(fetchedMessages);
    }
  });
});

app.post('/api/saveVotes', (req, res) => {
  console.log('SSAVED VOTES', req.body);
  // rooms[socket.room].votes[req.body.user] = req.body.votes
});

app.post('/api/vetoes', (req, res) => {
  const {
    name, roomID, voter, restaurant_id,
  } = req.body;
  dbHelpers.updateVetoes(voter, restaurant_id, name, roomID, (err, restaurant) => {
    if (err) {
      console.log('Error vetoing restaurant', err);
    } else {
      res.end('Restaurant vetoed!', restaurant);
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
  users = [];
  rooms = {};
  connections = [];
  userSockets = {};


  const io = socket(server);
  io.on('connection', (socket) => {
    socket.on('username connect', (data) => {
      socket.username = data;
      userSockets[socket.username] = socket;
      users.push(socket.username);
    });

    socket.on('join', (data) => {
      socket.room = data.room;
      // socket.username = data.user
      // userSockets[socket.username] = socket
      // users.push(socket.username);
      if (!rooms[socket.room]) {
        rooms[socket.room] = [{}, socket.username];
        // rooms[socket.room].votes = {}
      } else {
        rooms[socket.room].push(socket.username);
      }

      socket.join(socket.room);
      io.sockets.in(socket.room).emit('roomJoin', socket.room);
      io.sockets.in(socket.room).emit('chat', {
        message: {
          user_id: socket.username,
          name: socket.username,
          message: `${socket.username} has joined the room!`,
        },
        roomId: socket.room,
      });

      const user_id = socket.username;
      const name = socket.username;
      const message = `${socket.username} has joined the room!`;

      dbHelpers.saveMessage(user_id, name, message, socket.room, (err, savedMessage) => {
        if (err) {
          console.log('Error saving message', err);
        }
      });
    });

    socket.on('invite', (data) => {
      // for(var el of data.users){
      //   console.log("IS THIS A FOR LOOP OR NOT", el)
      //   if(el === socket.username){
      //     console.log('USERNAME HIT:', el)
      // io.emit('invitation', `You're invited to play in ${data.room}`)
      socket.broadcast.emit('invitation', {
        users: data.users, roomHash: data.roomHash, roomName: data.roomName, host: socket.username,
      });
      // }
      // }
    });

    socket.on('chat', (data) => {
      io.sockets.in(socket.room).emit('chat', data);
      // Mitsuku only responds half the time

      // Delay Mitsuku a random number of seconds
      setTimeout(() => {
        mitsuku.send(data.message.message)
          .then((response) => {
            // Save her message to the db
            dbHelpers.saveMessage(
              null,
              'mitsuku@mitsuku.com',
              response,
              data.roomID,
              (err) => {
                if (err) { console.log('Error saving message', err); }
              },
            );

            // Emit her message via socket
            io.sockets.in(socket.room).emit(
              'chat',
              {
                message: {
                  user_id: null,
                  name: 'mitsuku@mitsuku.com',
                  message: response,
                },
                roomID: data.roomID,
              },
            );
          });
      }, Math.random() * 5000 + 2000);
    });


    socket.on('vote', (data) => {
      rooms[socket.room][0][data.user] = data.votes
      if(rooms[socket.room].length - 1 === Object.keys(rooms[socket.room][0]).length){
        gameLogic.calcScores(rooms[socket.room])
      rooms[socket.room][0][data.user] = data.votes;
      if (rooms[socket.room].length - 1 === Object.keys(rooms[socket.room][0]).length) {
        const scores = gameLogic.calcScores(rooms[socket.room]);
        // const scoresArr = [];
        // Object.keys(scores).forEach(key => scoresArr.push([key, scores[key]]));
        db.models.Room.findOne({ where: { uniqueid: socket.room } })
          .then((room) => {
            // Check if record exists in db
            if (room) {
              room.updateAttributes({
                scores: JSON.stringify(scores),
              });
            }
          });
        io.sockets.in(socket.room).emit('scores', scores);
      }
    };

 
  })
});
})

let timerObj = {};
const nominateTimerObj = {};
