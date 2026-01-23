import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_EMAIL,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SENDER_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
const sendEmail = async ({to , subject , body}) => {
const response = await transporter.sendMail({
    from:process.env.SENDER_EMAIL,
    to,
    subject,
    html: body, 
});
return response;
}
export default sendEmail;