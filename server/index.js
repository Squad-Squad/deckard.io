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
const tock = require('tocktimer');
const mitsuku = require('../lib/mitsukuHelper')();

const Mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET,
);

const db = require('../database-postgresql/models/index');
const dbHelpers = require('../db-controllers');

const { Op } = db;

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

// app.use((req, res, next) => {
//   console.log(req.session);
//   next();
// });


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
  // console.log('NEW ROOM DATA', req.body);
  const { roomName, members } = req.body;
  const roomUnique = uniqueString();
  timerObj[roomUnique] = new tock({
    countdown: true,
    complete: () => {
      console.log('TIMER OVER');
      dbHelpers.saveWinner(roomUnique);
    },
  });
  timerObj[roomUnique].start(180000);

  dbHelpers.saveRoomAndMembers(roomName, members, roomUnique, (err, room, users) => {
    if (err) {
      console.log('Error saving room and members', err);
    } else {
      console.log(`Saved room: ${roomName}`);
      res.send(room[0].dataValues);
    }
  });
});

app.get('/api/rooms/:roomID', (req, res) => {
  const { roomID } = req.params;
  dbHelpers.getRoomMembers(roomID, (err, roomMembers) => {
    if (err) {
      console.log('Error getting room members', err);
    } else {
      console.log(`Got for ${roomID} roommembers: ${JSON.stringify(roomMembers)}`);
      res.send(roomMembers);
    }
  });
});

app.get('/api/timer/:roomID', (req, res) => {
  const { roomID } = req.params;
  res.send({ timeLeft: timerObj[roomID].lap() });
});

app.get('/api/nominatetimer/:roomID', (req, res) => {
  const { roomID } = req.params;
  res.send({ timeLeft: nominateTimerObj[roomID].lap() });
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
    console.log('WINNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNER', response)
    res.send(response);
  });
});


//
// ─── HANDLE MESSAGES AND VOTES─────────────────────────────────────────────────────────
//
app.post('/api/messages', (req, res) => {
  const { user_id, message, roomID } = req.body;
  console.log('NOMIIIIIIINNNNNNNNNNNATION TIMER', nominateTimerObj);
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

app.post('/api/nominate', (req, res) => {
  const { name, roomID, restaurantID } = req.body;
  // Timer for nominations
  nominateTimerObj[roomID] = new tock({
    countdown: true,
    complete: () => {
      console.log('TIMER OVER');
      delete nominateTimerObj[roomID];
    },
  });
  nominateTimerObj[roomID].start(15000);

  console.log('NOMIIIIIIINNNNNNNNNNNATION TIMER', nominateTimerObj[roomID]);

  dbHelpers.saveRestaurant(name, roomID, (err, restaurant) => {
    if (err) {
      console.log('Error saving restaurant', err);
    } else {
      res.end('Restaurant saved!', restaurant);
    }
  });

  // Joseph SQL
  dbHelpers.saveCurrentRestaurant(roomID, restaurantID, (err, restaurant) => {
    if (err) {
      console.log('Error saving current restaurant', err);
    } else {
      res.end('Current restaurant saved!', restaurant);
    }
  });
});

app.post('/api/votes', (req, res) => {
  const {
    name, roomID, voter, restaurant_id, nominator,
  } = req.body;
  dbHelpers.updateVotes(voter, restaurant_id, name, roomID, nominator, (err, restaurant) => {
    if (err) {
      console.log('Error upvoting restaurant', err);
    } else {
      res.end('Restaurant upvoted!', restaurant);
    }
  });
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

app.get('/api/votes/:roomID', (req, res) => {
  const { roomID } = req.params;
  dbHelpers.getScoreboard(roomID, (err, scores) => {
    if (err) {
      console.log('Error fetching scoreboard', err);
    } else {
      res.send(scores);
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
  rooms = {}
  connections = [];
  userSockets = {};


  const io = socket(server);
  io.on('connection', (socket) => {
    console.log('made socket connection', socket);

    socket.on('username connect', (data)=>{
      console.log("USERNAME CONNECT:", data)
      socket.username = data
      userSockets[socket.username] = socket
      users.push(socket.username);
      console.log("USERSOCKETS:", userSockets)
    })

    socket.on('join', (data) => {
        console.log("JOIN DATA:", data)
      socket.room = data.room
      // socket.username = data.user
      // userSockets[socket.username] = socket
      // users.push(socket.username);
      if(!rooms[socket.room]){
        rooms[socket.room] = [socket.username];
      }else{
        rooms[socket.room].push(socket.username)
      }

      socket.join(socket.room)
      io.sockets.in(socket.room).emit('roomJoin', socket.room)
      io.sockets.in(socket.room).emit('chat', {
        message: {
                  user_id: socket.username,
                  name: socket.username,
                  message: `${socket.username} has joined the room!`,
                }, 
        roomId: socket.room
      })

      let user_id = socket.username
      let name = socket.username
      let message = `${socket.username} has joined the room!`

      dbHelpers.saveMessage(user_id, name, message, socket.room, (err, savedMessage) => {
        if (err) {
          console.log('Error saving message', err);
        } else {
          console.log('saved Message:', savedMessage)
        }
      });

    });

    socket.on('invite', (data)=>{
      console.log("INVITE DATA:", data, "users:", data.users, "current username:", socket.username)

      // for(var el of data.users){
      //   console.log("IS THIS A FOR LOOP OR NOT", el)
      //   if(el === socket.username){
      //     console.log('USERNAME HIT:', el)
          // io.emit('invitation', `You're invited to play in ${data.room}`)
          socket.broadcast.emit('invitation', {users: data.users, room: data.room})
        // }
      // }


    })

    socket.on('chat', (data) => {
      console.log('Received chat!', data);
      io.sockets.in(socket.room).emit('chat', data);
      console.log("ROOMS IN SERVER:", rooms)
      // Mitsuku only responds half the time

      // Delay Mitsuku a random number of seconds
      setTimeout(() => {
        mitsuku.send(data.message.message)
          .then((response) => {
            // Save her message to the db
            dbHelpers.saveMessage(
              null,
              'Mitsuku',
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
                  name: 'Mitsuku',
                  message: response,
                },
                roomID: data.roomID,
              },
            );
          });
      }, Math.random() * 5000 + 2000);
    });

    // socket.on('nominate', (data) => {
    //   console.log('Nomination received!', data);
    //   io.sockets.emit('nominate', data);
    // });

    socket.on('vote', (data) => {
      console.log('Received vote!', data);
      io.sockets.emit('vote', data.roomID);
    });

    // newSocket.on('veto', (data) => {
    //   console.log('Received veto!', data);
    //   io.sockets.emit('veto', data.roomID);
    // });

  });
});

let timerObj = {};
let nominateTimerObj = {};
