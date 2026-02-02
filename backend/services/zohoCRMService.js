const axios = require('axios');
const logger = require('../config/logger');

class ZohoCRMService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async refreshAccessToken() {
        try {
            const url = 'https://accounts.zoho.com/oauth/v2/token';

            const params = new URLSearchParams({
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token',
            });

            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            logger.info('Zoho access token refreshed successfully');
            return this.accessToken;
        } catch (error) {
            logger.error('Failed to refresh Zoho access token', {
                error: error.response?.data || error.message,
            });
            throw new Error('Zoho authentication failed');
        }
    }
    async getAccessToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }
    async createLead(userData) {
        const maxRetries = 3;
        const retryDelays = [1000, 3000, 9000]; 

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const token = await this.getAccessToken();
                const url = `${process.env.ZOHO_API_DOMAIN}/crm/v3/Leads`;

                const nameParts = userData.name.trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || firstName;

                const payload = {
                    data: [
                        {
                            First_Name: firstName,
                            Last_Name: lastName,
                            Email: userData.email,
                            Phone: userData.phone,
                            Lead_Source: 'OTP Onboarding',
                            Lead_Status: 'Verified',
                            Description: `User registered via OTP onboarding on ${new Date().toISOString()}`,
                        },
                    ],
                    trigger: ['approval', 'workflow', 'blueprint'],
                };

                const response = await axios.post(url, payload, {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                });

                const leadData = response.data.data?.[0];

                if (leadData?.code === 'SUCCESS') {
                    logger.info('Lead created in Zoho CRM', {
                        leadId: leadData.details.id,
                        email: userData.email,
                    });

                    return {
                        success: true,
                        leadId: leadData.details.id,
                        data: leadData,
                    };
                } else {
                    throw new Error(leadData?.message || 'Failed to create lead');
                }
            } catch (error) {
                logger.error(`Zoho CRM attempt ${attempt + 1} failed`, {
                    error: error.response?.data || error.message,
                    email: userData.email,
                });

                if (attempt === maxRetries - 1) {
                    throw new Error('Failed to sync with CRM after multiple attempts');
                }

                await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
            }
        }
    }

    async syncUserToCRM(user) {
        try {
            const result = await this.createLead({
                name: user.name,
                email: user.email,
                phone: user.phone,
            });

            user.crmSynced = true;
            user.crmId = result.leadId;
            await user.save();

            logger.info('User synced to CRM successfully', {
                userId: user._id,
                crmId: result.leadId,
            });
        } catch (error) {
            logger.error('Failed to sync user to CRM', {
                userId: user._id,
                error: error.message,
            });

            user.crmSynced = false;
            await user.save();
        }
    }
}

module.exports = new ZohoCRMService();



