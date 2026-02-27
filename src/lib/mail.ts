import { Resend } from 'resend';

/**
 * Sends an invitation email to a newly created employee.
 * 
 * @param email - The employee's email address.
 * @param password - The password set by the admin.
 * @param name - The employee's full name.
 */
export async function sendInvitationEmail(email: string, password: string, name: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
        console.warn("RESEND_API_KEY not set in environment variables. Cannot send invitation email.");
        throw new Error("Email service is not configured on this server");
    }

    const resend = new Resend(resendApiKey);

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
        console.log("Sending email via Resend API...");
        const data = await resend.emails.send({
            from: 'Timey Admin <onboarding@resend.dev>', // Resend test domain
            to: email,
            subject: 'Welcome to Timey - Your Account Details',
            html: htmlContent,
        });
        
        if (data.error) {
            console.error("Resend API returned an error:", data.error);
            throw new Error(`Resend Error: ${data.error.message}`);
        }

        console.log("Invitation email sent successfully:", data);
        return data;
    } catch (error: any) {
        console.error("Error sending invitation email via Resend:", error.message || error);
        throw new Error(`Email Service Error: ${error.message || "Failed to send email"}`);
    }
}
