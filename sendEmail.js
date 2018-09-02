var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jimjammer2018@gmail.com',
    pass: 'Zapper2018'
  }
});

var mailOptions = {
  from: 'jimjammer2018@gmail.com',
  to: 'realityexpander@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});