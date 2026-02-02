const axios = require('axios');
const logger = require('../config/logger');


const sendWhatsAppOTP = async (phoneNumber, otp) => {
    try {
        const formattedPhone = phoneNumber.replace('+', '');

        const url = `https://graph.facebook.com/${process.env.META_API_VERSION}/${process.env.META_PHONE_NUMBER_ID}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: process.env.META_TEMPLATE_NAME || 'otp_verification',
                language: {
                    code: process.env.META_TEMPLATE_LANGUAGE || 'en',
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: otp.toString(),
                            },
                        ],
                    },
                ],
            },
        };

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000, 
        });

        logger.info('WhatsApp OTP sent successfully', {
            phone: formattedPhone,
            messageId: response.data.messages?.[0]?.id,
        });

        return {
            success: true,
            messageId: response.data.messages?.[0]?.id,
            data: response.data,
        };
    } catch (error) {
        logger.error('WhatsApp OTP send failed', {
            phone: phoneNumber,
            error: error.response?.data || error.message,
            status: error.response?.status,
        });

        if (error.response?.data?.error) {
            const whatsappError = error.response.data.error;
            throw new Error(
                `WhatsApp API Error: ${whatsappError.message || 'Failed to send OTP'}`
            );
        }

        throw new Error('Failed to send OTP via WhatsApp. Please try again.');
    }
};

const verifyWhatsAppConfig = async () => {
    try {
        const url = `https://graph.facebook.com/${process.env.META_API_VERSION}/${process.env.META_PHONE_NUMBER_ID}`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
            },
        });

        logger.info('WhatsApp configuration verified', {
            phoneNumberId: process.env.META_PHONE_NUMBER_ID,
            displayPhone: response.data.display_phone_number,
        });

        return true;
    } catch (error) {
        logger.error('WhatsApp configuration verification failed', {
            error: error.response?.data || error.message,
        });
        return false;
    }
};

module.exports = {
    sendWhatsAppOTP,
    verifyWhatsAppConfig,
};
