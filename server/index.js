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

const upload = multer({});
const s3 = new AWS.S3();
const s3Params = {
  bucket: 'deckard-io',
  key: `avatars/${Date.now()}`,
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
}), (req, res) => {
  res.status(200).redirect('/');
});

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
  console.log('USERINFO in server', req.body);
  db.models.User.findOne({ where: { username: req.body.user } })
    .then((user) => {
      res.send(JSON.parse(JSON.stringify(user)));
    });
});

app.post('/profile/update-user', (req, res) => {
  console.log('SOMETHINGS HAPPENING AT LEAST');
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

  const { roomName, roomMode, members } = req.body;
  const roomUnique = uniqueString().slice(0, 6);
  timerObj[roomUnique] = new Tock({
    countdown: true,
  });


  dbHelpers.aliasMembers(roomName, roomMode, members, (results) => {
    client.hmset(`${roomUnique}:members`, results);
  });


  // CHANGE THE ROOM TIMER LENGTH HERE
  timerObj[roomUnique].start(100000);

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




app.post('/api/userInfo', (req, res) => {
  console.log('USERINFO in server', req.body);
  db.models.User.findOne({ where: { email: req.body.user } })
    .then((instance) => {
      console.log('USERINFO FROM DATABaSE', instance);
      const lifeTimeScore = instance.get('lifetime_score');
      res.send(JSON.stringify(lifeTimeScore));
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
        console.log(socket.username, 'removed before adding');
      });

      client.rpush('onlineUsers', socket.username, (err, reply) => {
        console.log('ONLINE USERS ADD:', reply);
      });

      userSockets[socket.username] = socket;
      

    });

    socket.on('join', (data) => {
      socket.room = data.room;
      socket.alias = data.user
      socket.roomMode = data.roomMode
      console.log("JOIN ROOM IN SOCKETRS:", socket.room, socket.alias, socket.id, "AND ROOM MODE:", socket.roomMode)
    
      if (!rooms[socket.room]) {
        rooms[socket.room] = [{}, socket.username];

      } else {
        rooms[socket.room].push(socket.username);
      }


      //actually join the socket namespace
      socket.join(socket.room);

      let user = socket.username

      client.rpush(`${socket.room}:membersList`, JSON.stringify({[user]: socket.id}), (err, replies)=>{
        if(err){
          console.log(err)
        }else{
          console.log('addToRoomMembers in redis', replies)
        }
      })

      //notify everyone when someone has joined the room
      const user_id = socket.username;
      const name = socket.username;
      const message = `${data.user} has joined the room!`;

      client.rpush(`${socket.room}:messages`, JSON.stringify({ 'matrixOverLords': message }));




      //notify everyone when mitsuku's joined the room (but only with her alias)
      if (rooms[socket.room].length === 2) {
        setTimeout(function(){
          //add mitsuku to the members list in redis
        client.rpush(`${socket.room}:membersList`, 'mitsuku@mitsuku.com', (err, replies)=>{
          console.log("mitsuku added to redis db", replies)
        });

          //add a message to room messages in redis notifying that mitsuku has joined
        const mitMessage = `${data.mitsuku} has joined the room`
        client.rpush(`${socket.room}:messages`, JSON.stringify({ 'matrixOverLords': mitMessage }), (err, reply)=>{
          console.log("I've pushed to redis:", reply)
        });       
       

          //fetch all the messages from redis right after adding mitsuku's joined room message
        dbHelpers.fetchRedisMessages(client, socket, (result)=>{
          console.log("RESULTS FROM HELPER FUNCTION", result)
          io.sockets.in(socket.room).emit('chat', result)          
        })
      }, Math.random() * 5000);
    }


      //if round robin room-mode is selected as soon as there are 2 people in the room one is told to speak first
      let membersInRoom;
      let membersInvitedtoRoom
      client.lrange(`${socket.room}:membersList`, 0, -1, (err, replies)=>{
        if(err){
          console.log(err)
        }else{
          // console.log("ALL ROOM MEMBERS FROM REDIS", replies)
        console.log("MEMBERSLIST DATA FROM REDIS:", replies)
          membersInRoom = replies       
        }

          client.lrange(`${socket.room}:membersInvited`, 0, -1, (err, replies)=>{
            if(err){
              console.log(err)
            }else{
              // console.log("ALL ROOM MEMBERS FROM REDIS", replies)
            console.log("MEMBERSINVITED DATA FROM REDIS:", replies)
              membersInvitedtoRoom = replies  
              console.log("ASSIGNED: MEMBERSLIST DATA FROM REDIS:", membersInRoom)
              console.log("ASSIGNED: MEMBERSINVITED DATA FROM REDIS:", membersInvitedtoRoom)
                  if(data.roomMode === "round"){
                    if(membersInRoom.length === membersInvitedtoRoom.length + 1){
                      io.sockets.in(socket.room).emit('roomReady', true)
                  }
              }
            }
          }) 
      })   



            //need to figure out how to make it so its not the first person in the room to go first always
            //but to avoid it fall on the bot
        //   if(data.roomMode === "round"){
        //       if(membersInRoom.length === membersInvitedtoRoom.length){
        //         io.sockets.in(socket.room).emit('roomReady', true)
        //     }
        // }



          //   console.log("CURRENTMEMBERS:", JSON.parse(currentMembers))
          //   io.sockets.sockets[socket.id].emit('yourTurn', true)
          //   };  
          // }


    //fetch all the messages from redis
     dbHelpers.fetchRedisMessages(client, socket, (result)=>{
          io.sockets.in(socket.room).emit('chat', result)          
      })


    });


    socket.on('invite', (data) => {

    data.users.forEach(user=>{

      console.log('userINvites in socket', user, "and dataHash", data.roomHash)
     client.rpush(`${data.roomHash}:membersInvited`, user, (err, reply)=>{
      console.log("replies from membersInvited", reply)
     })
     client.lrange(`${data.roomHash}:membersInvited`, 0, -1, (err, reply)=>{
      console.log("updated members in membersInvited", reply)

     })

    })

     //send invitation to all online users (whether they are invited or not is sorted on front end), except inviter

      socket.broadcast.emit('invitation', {
        users: data.users, roomHash: data.roomHash, roomName: data.roomName, host: socket.username, roomMode: data.roomMode
      });
    });



    socket.on('chat', (data) => {
      let user = data.message.name
      let message = data.message.message

      //push all the messages sent from client to redis room key message list
      client.rpush(`${socket.room}:messages`, JSON.stringify({ [user]:message }));



      // Change Mitsuku's response frequency based on the number of room users
      let extraDelay = 0;
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
              
              //and retrieve all the messages immediately after
              dbHelpers.fetchRedisMessages(client, socket, (result)=>{
                io.sockets.in(socket.room).emit('chat', result)          
                })

    
            }, Math.random() * 5000 + 2000 + extraDelay);
          });
      }

      //retrieve all the messages from redis everytime a message is received
    dbHelpers.fetchRedisMessages(client, socket, (result)=>{
      io.sockets.in(socket.room).emit('chat', result)          
      })
    });


    //handle cases in which an invitation to a room is declined, remove from membersinvited so when compared with who has joined
    //we know when to start the room
    socket.on('decline', data=>{

      console.log("SOCKET DECLINE DATA:", data)


      client.lrem(`${data.roomID}:membersInvited`, 0, data.user, (err, reply)=>{
        console.log('decline REPLIES', reply)
      })
      client.lrange(`${data.roomID}:membersInvited`, 0, -1, (err, reply)=>{
        console.log("updatedMembersInvitedList after decline:", reply)
      })

      let membersInRoomDECLINE;
      let membersInvitedtoRoomDECLINE
      client.lrange(`${data.roomID}:membersList`, 0, -1, (err, replies)=>{
        if(err){
          console.log(err)
        }else{
          // console.log("ALL ROOM MEMBERS FROM REDIS", replies)
        console.log("MEMBERSLIST DATA FROM REDIS:", replies)
          membersInRoomDECLINE = replies       
        }

          client.lrange(`${data.roomID}:membersInvited`, 0, -1, (err, replies)=>{
            if(err){
              console.log(err)
            }else{
              membersInvitedtoRoomDECLINE = replies  
              console.log("ASSIGNED IN DECLINE: MEMBERSLIST DATA FROM REDIS:", membersInRoomDECLINE)
              console.log("ASSIGNED IN DECLINE: MEMBERSINVITED DATA FROM REDIS:", membersInvitedtoRoomDECLINE)
                console.log("GAME MODE WORKING?", data.roomMode)
                  if(data.roomMode === "round"){
                    console.log("IS THIS CONDITIONAL HIT: ROUND")
                    if(membersInRoomDECLINE.length >= membersInvitedtoRoomDECLINE.length){
                      console.log("IS THIS CONDITIONAL HIT: EQUALITY")
                      io.sockets.in(data.roomID).emit('roomReady', true)
                  }
              }
            }
          }) 
      })   

    })


    //handle cases in which player leaves the room without completely disconnecting from the site
    socket.on('leaveRoom', data=>{

      if(socket.room){
        rooms[socket.room].splice(rooms[socket.room].indexOf(socket.username), 1)

        client.rpush(`${socket.room}:messages`, JSON.stringify({ 'matrixOverLords': `${socket.alias} left the room` }));

        dbHelpers.fetchRedisMessages(client, socket, (result)=>{
          io.sockets.in(socket.room).emit('chat', result)          
          })
      }
    });



    socket.on('disconnect', (data) =>{
      let thisRoom = rooms[socket.room]

      if(rooms[socket.room]){
        users.splice(users.indexOf(socket.username), 1)
        rooms[socket.room].splice(thisRoom.indexOf(socket.username), 1) 
        console.log('this users has disconnected:', socket.username, "AND ROOMS[SOCKET.ROOM] AFTER DISCONNECT:", rooms[socket.room])
        client.rpush(`${socket.room}:messages`, JSON.stringify({ 'matrixOverLords': `${socket.alias} left the room` }));
      }
      

      client.lrem('onlineUsers', 1, socket.username, (err, replies) => {
        console.log("WAS I REMOVED FROM REDIS WHEN I DISCONNECTED:", socket.username)
        console.log('REMOVE REPLY', replies);
      });

      client.lrange('onlineUsers', 0, -1, (err, reply) => {
        console.log('ONLINE USERS CHECK:', reply);
      });


      socket.leave(socket.room);
      // console.log('SOCKET.ROOMS', rooms);


      dbHelpers.fetchRedisMessages(client, socket, (result)=>{
        io.sockets.in(socket.room).emit('chat', result)          
        })

      connections.splice(connections.indexOf(socket), 1);
    });


    socket.on('vote', (data) => {
      rooms[socket.room][0][data.user] = data.votes;

      // determine if everyone has submitted there votes
      if (rooms[socket.room].length - 1 === Object.keys(rooms[socket.room][0]).length) {
        const scores = gameLogic.calcScores(rooms[socket.room]);

      //add everyones scores to their lifetime scores in postgres db
        for (var user in scores) {
          db.models.User.findOne({ where: { username: user } })
            .then((instance) => {
              console.log('user in db', user);
              const oldScore = instance.get('lifetime_score');
              // console.log('OLD LIFETIME SCORE:', oldScore);
              console.log()
                instance.updateAttributes({
                  lifetime_score: oldScore + scores[user],
                });                
              })
            };
      


        io.sockets.in(socket.room).emit('scores', scores);
      }

    })

  });


});

let timerObj = {};
const nominateTimerObj = {};
