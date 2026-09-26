const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send password reset code by email
 */
const sendPasswordResetEmail = async (email, resetCode) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not configured");
    }

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: [email],
        subject: "Shepherd Password Reset Code",

        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Password Reset</title>
            </head>

            <body style="
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: Arial, Helvetica, sans-serif;
            ">

                <div style="
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                ">

                    <div style="
                        background-color: #0f2a5f;
                        padding: 25px;
                        text-align: center;
                    ">
                        <h1 style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 26px;
                        ">
                            Shepherd
                        </h1>
                    </div>

                    <div style="padding: 30px;">

                        <h2 style="
                            color: #222222;
                            margin-top: 0;
                        ">
                            Password Reset
                        </h2>

                        <p style="
                            color: #555555;
                            font-size: 16px;
                            line-height: 1.6;
                        ">
                            We received a request to reset your Shepherd account password.
                        </p>

                        <p style="
                            color: #555555;
                            font-size: 16px;
                            line-height: 1.6;
                        ">
                            Your password reset code is:
                        </p>

                        <div style="
                            text-align: center;
                            margin: 30px 0;
                        ">

                            <span style="
                                display: inline-block;
                                background-color: #f0f3f8;
                                color: #0f2a5f;
                                font-size: 32px;
                                font-weight: bold;
                                letter-spacing: 8px;
                                padding: 18px 25px;
                                border-radius: 8px;
                            ">
                                ${resetCode}
                            </span>

                        </div>

                        <p style="
                            color: #555555;
                            font-size: 15px;
                            line-height: 1.6;
                        ">
                            This code will expire in <strong>10 minutes</strong>.
                        </p>

                        <p style="
                            color: #777777;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            If you did not request a password reset, you can safely ignore
                            this email.
                        </p>

                    </div>

                    <div style="
                        background-color: #f4f6f8;
                        padding: 20px;
                        text-align: center;
                    ">
                        <p style="
                            margin: 0;
                            color: #888888;
                            font-size: 12px;
                        ">
                            Shepherd Church Management System
                        </p>
                    </div>

                </div>

            </body>
            </html>
        `,
    });

    if (error) {
        console.error("RESEND EMAIL ERROR:", error);

        throw new Error("Failed to send password reset email");
    }

    console.log("PASSWORD RESET EMAIL SENT:", data?.id);

    return data;
};

module.exports = {
    sendPasswordResetEmail,
};