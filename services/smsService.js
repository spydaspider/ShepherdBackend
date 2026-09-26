const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send password reset code by SMS
 */
const sendPasswordResetSMS = async (phone, resetCode) => {
    if (!process.env.TWILIO_ACCOUNT_SID) {
        throw new Error("TWILIO_ACCOUNT_SID is not configured");
    }

    if (!process.env.TWILIO_AUTH_TOKEN) {
        throw new Error("TWILIO_AUTH_TOKEN is not configured");
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER is not configured");
    }

    if (!phone) {
        throw new Error("Phone number is required");
    }

    const message = await client.messages.create({
        body:
            `Shepherd: Your password reset code is ${resetCode}. ` +
            `This code expires in 10 minutes.`,

        from: process.env.TWILIO_PHONE_NUMBER,

        to: phone,
    });

    console.log("PASSWORD RESET SMS SENT:", message.sid);

    return message;
};

module.exports = {
    sendPasswordResetSMS,
};