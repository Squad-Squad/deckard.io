const passport = require('passport');
const db = require('../database-postgresql/models/index');
const dbHelpers = require('../db-controllers/index');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const email = require('./nodemailerHelpers');
const { Op } = require('sequelize');
const crypto = require('crypto');

//
// ─── LOCAL STRATEGY ─────────────────────────────────────────────────────────────
//
exports.passportHelper = (passport, client) => {
  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
      },
      (req, username, password, done) => {
        // console.log("___MULTI____", multi);

        // Only create new user if the email hasn't been used
        db.models.User.findOne({ where: { [Op.or]: [{ username, email: req.body.email }] } }).then((foundUser) => {
          if (!foundUser) {
            dbHelpers.saveMember(username, req.body.email, password, false, false, null, (userToSave) => {
              done(null, userToSave.dataValues);
            });

            const hashedUsername = dbHelpers.hashUsername(username);

            dbHelpers.saveVerificationHash(client, hashedUsername, username);

            // Send email indicating successful registration
            const options = email.signupOptions(req.body.email, hashedUsername, username);
            email.sendMail(options);
          } else {
            done('error');
          }
        });
      },
    ),
  );

  passport.use(
    'local-login',
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
      },
      (req, username, password, done) => {
        db.models.User.findOne({
          where: { [Op.or]: [{ username }, { email: req.body.email }] },
        }).then((foundUser) => {
          if (foundUser) {
            bcrypt
              .compare(password, foundUser.dataValues.password)
              .then((valid) => {
                if (valid) {
                  done(null, foundUser.dataValues);
                }
              })
              .catch(console.log);
          }
        });
      },
    ),
  );

  //
  // ─── GOOGLE STRATEGY ────────────────────────────────────────────────────────────
  //
  const domain = process.env.DOMAIN ? process.env.DOMAIN : 'localhost:3000';
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: `http://${domain}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const name = profile.displayName.split(' ')[0];
      const email = profile.emails[0].value;
      db.models.User.findOne({ where: { email } })
        .then((foundUser) => {
        // Only add user if email is unregistered
          if (!foundUser) {
            dbHelpers.saveMember(name, email, null, true, false, null, (userToSave) => {
              done(null, userToSave.dataValues);
            });
            // Send email indicating successful registration
            const options = email.signupOptions(email);
            email.sendMail(options);
            console.log('Welcome email sent to ', email);
          } else {
            done(null, foundUser.dataValues);
          }
        })
        .catch(console.log);
    },
  ));

  //
  // ─── GITHUB STRATEGY ────────────────────────────────────────────────────────────
  //
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/github/callback',
    },
    (async (accessToken, refreshToken, profile, done) => {
      console.log('GITHUB PROFILE', profile);
      const username = profile.username;
      db.models.User.findOne({ where: { github_id: profile.id } })
        .then((foundUser) => {
        // Only add user if  is unregistered
          if (!foundUser) {
            dbHelpers.saveMember(username, null, null, false, true, profile.id, (userToSave) => {
              done(null, userToSave.dataValues);
            });
            // Send email indicating successful registration
            const options = email.signupOptions(email);
            email.sendMail(options);
            console.log('Welcome email sent to ', email);
          } else {
            done(null, foundUser.dataValues);
          }
        })
        .catch(console.log);
    }),
  ));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });
};
