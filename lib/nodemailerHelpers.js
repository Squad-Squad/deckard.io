const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD,
  },
});

exports.signupOptions = address => ({
  from: 'd3ck4rd.io@gmail.com',
  to: address,
  subject: 'Welcome to the deckard.io!',
  html: `<b>Click <a href='${process.env.DOMAIN}'>here</a> to get started!</b>`,
});

exports.sendMail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      return console.log(error);
    }
  });
};
