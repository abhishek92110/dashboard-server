const nodemailer = require("nodemailer");
const cron = require("node-cron");



const resetpassword = async (req, res) => {
    console.log("from sendmailer",req.body)
    const email = req.body.email;
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'deepaksharma979821@gmail.com',
        pass: 'xhmkzvfqjvhvymar'
      },
    });

    transporter.sendMail({
      from: "deepaksharma979821@gmail.com",
      to: email,
      subject: "Random generated passowrd",
      text: `this is your random password ${email} for initial login change it later if you want to`,
      html: `this is your random password ${email} for initial login change it later if you want to`,
    }, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("An error occurred while sending the email.");
      } else {
        console.log("Email sent:", info.response);
        res.send({"send":"true","info":info});
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending the email.");
  }
};


module.exports = resetpassword;
