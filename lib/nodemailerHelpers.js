const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD,
  },
});

exports.signupOptions = (address, hash, username) => ({
  from: 'd3ck4rd.io@gmail.com',
  to: address,
  subject: 'Welcome to the deckard.io!',
  html: `<b>Welcome to deckard.io ${username}, please verify your account at  <a href='http://${
    process.env.DOMAIN
  }/verify/${hash}'>http://${process.env.DOMAIN}/verify/${hash}</a></b>
        <br /> If the link is expired please visit <a href='http://${
  process.env.DOMAIN
  }/regenerate/${username}'>http://${process.env.DOMAIN}/regenerate/${username}</a>
        `,
});

exports.sendMail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      return console.log(error);
    }
  });
};
