import nodemailer from "nodemailer";

/**
 * Sends an invitation email to a newly created employee.
 * 
 * @param email - The employee's email address.
 * @param password - The password set by the admin.
 * @param name - The employee's full name.
 */
export async function sendInvitationEmail(email: string, password: string, name: string) {
    // These should be set in your .env file
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("SMTP_USER or SMTP_PASS not set. Skipping invitation email.");
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user,
            pass,
        },
    });

    const mailOptions = {
        from: `"Timey" <${user}>`,
        to: email,
        subject: "Welcome to Timey - Your Account Details",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                <h2 style="color: #10b981;">Welcome to Timey, ${name}!</h2>
                <p>An account has been created for you by your administrator.</p>
                <p>You can now log in to the Timey portal using the credentials below:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please make sure to change your password after your first login.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">This is an automated email. Please do not reply to this message.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Invitation email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending invitation email:", error);
        throw error;
    }
}
