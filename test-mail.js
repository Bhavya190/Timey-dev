require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    console.log("Testing SMTP connection...");
    console.log("User:", process.env.SMTP_USER);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Timey" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // send to self
            subject: "Timey Test Email",
            text: "This is a test email from the Timey App.",
        });
        console.log("Success! Message ID:", info.messageId);
    } catch (err) {
        console.error("Mail Error:", err);
    }
}

test();
