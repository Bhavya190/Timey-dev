import nodemailer from "nodemailer";

/**
 * Sends an invitation email to a newly created employee via Mailtrap.
 * 
 * @param email - The employee's email address.
 * @param password - The password set by the admin.
 * @param name - The employee's full name.
 */
export async function sendInvitationEmail(email: string, password: string, name: string) {
    const host = process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io";
    const port = Number(process.env.EMAIL_PORT) || 2525;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "admin@timey.com";
    const fromName = process.env.EMAIL_FROM_NAME || "Timey Admin";
    
    if (!user || !pass) {
        console.warn("EMAIL_USER or EMAIL_PASSWORD not set in environment variables. Cannot send email.");
        throw new Error("Mail credentials are not configured on this server");
    }

    // Configured for generic SMTP or Mailtrap
    const transporter = nodemailer.createTransport({
        host,
        port,
        auth: {
            user,
            pass
        }
    });

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
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
    `;

    try {
        console.log("Sending email via Mailtrap...");
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to: email,
            subject: 'Welcome to Timey - Your Account Details',
            html: htmlContent,
        });

        console.log("Invitation email sent successfully to Mailtrap: %s", info.messageId);
        return info;
    } catch (error: any) {
        console.error("Error sending invitation email via Mailtrap:", error.message || error);
        throw new Error(`Mailtrap Error: ${error.message || "Failed to send email"}`);
    }
}
