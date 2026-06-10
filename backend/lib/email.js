const { Resend } = require("resend");

const sendPasswordResetEmail = async (email, resetUrl) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Music App <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password",
    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reset your password</h2>
                <p>You requested a password reset. Click the link below to set a new password.</p>
                <p>The link expires in 1 hour.</p>
                <a href="${resetUrl}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #f39c12;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 16px 0;
                ">Reset Password</a>
                <p>If you did not request this, ignore this email — your password will not change.</p>
            </div>
        `,
  });

  if (error) {
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
};

module.exports = { sendPasswordResetEmail };
