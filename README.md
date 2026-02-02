# OTP-Based User Onboarding System

A production-ready, secure OTP-based user onboarding flow with WhatsApp Cloud API integration, MongoDB storage, and Zoho CRM synchronization.

## 🏗️ Architecture

```
Frontend (React.js) ←→ Backend (Node.js/Express) ←→ MongoDB
                              ↓
                    WhatsApp Cloud API (Meta)
                              ↓
                         Zoho CRM
```

## 🚀 Features

### Frontend
- ✅ Modern React.js with hooks
- ✅ Client-side validation (E.164 phone format, email)
- ✅ OTP verification with auto-focus and paste support
- ✅ Protected routes with JWT authentication
- ✅ Premium dark theme with glassmorphism
- ✅ Responsive design
- ✅ Environment variable configuration

### Backend
- ✅ RESTful API with Express.js
- ✅ Secure OTP generation (crypto.randomInt)
- ✅ OTP hashing with bcrypt (never store plain OTPs)
- ✅ TTL-based OTP expiry (5 minutes)
- ✅ Rate limiting (3 OTP requests per 15 minutes)
- ✅ JWT authentication (7-day expiry)
- ✅ WhatsApp Cloud API integration
- ✅ Zoho CRM integration with retry logic
- ✅ MongoDB with indexes and TTL
- ✅ Comprehensive error handling
- ✅ Production-grade logging (Winston)
- ✅ Security middleware (Helmet, CORS, Sanitization)

### Security
- 🔒 OTP hashed with bcrypt (10 salt rounds)
- 🔒 One-time use enforcement
- 🔒 Time-bound expiry (5 minutes)
- 🔒 Rate limiting on all endpoints
- 🔒 JWT token-based sessions
- 🔒 HTTPS-only in production
- 🔒 No sensitive data in URLs
- 🔒 Environment variables for secrets

## 📋 Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- Meta Developer Account with WhatsApp Cloud API
- Zoho CRM account (optional)

## 🛠️ Installation

### 1. Clone/Navigate to Project
```bash
cd c:/Users/raide/Desktop/meta_app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Configure `.env` file** (already created with your credentials):
- MongoDB URI: ✅ Configured
- WhatsApp Access Token: ✅ Configured
- WhatsApp Phone Number ID: ✅ Configured
- Update `JWT_SECRET` with a strong random string
- Update Zoho credentials if using CRM integration

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🎯 WhatsApp Cloud API Setup

### Step 1: Create Meta Developer Account
1. Go to https://developers.facebook.com
2. Sign up/login with Facebook account
3. Complete business verification (for production)

### Step 2: Create App
1. Click "My Apps" → "Create App"
2. Select "Business" type
3. Enter app name and contact email

### Step 3: Enable WhatsApp Cloud API
1. In app dashboard → "Add Product"
2. Select "WhatsApp" → "Set Up"
3. You'll get a temporary access token (24 hours)

### Step 4: Create Message Template
**Template Name:** `otp_verification`
**Category:** Authentication
**Language:** English

**Template Body:**
```
Your verification code is {{1}}. Valid for 5 minutes. Do not share this code with anyone.
```

**Important:**
- Template must be approved by Meta for production
- Sandbox allows testing without approval
- Variable {{1}} will be replaced with the OTP

### Step 5: Get Permanent Access Token
1. Go to "WhatsApp" → "API Setup"
2. Create System User in Business Settings
3. Generate permanent token with `whatsapp_business_messaging` permission
4. Update `.env` with the new token

## 🔧 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
App runs on: http://localhost:3000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## 📡 API Endpoints

### POST /api/auth/request-otp
Request OTP for phone verification

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your WhatsApp number",
  "otpId": "uuid-here",
  "expiresIn": 5
}
```

### POST /api/auth/verify-otp
Verify OTP and create/login user

**Request:**
```json
{
  "otpId": "uuid-here",
  "otp": "123456",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "isVerified": true
  }
}
```

### GET /api/auth/me
Get current user (protected)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String (unique, indexed),
  email: String (unique, indexed),
  isVerified: Boolean,
  crmSynced: Boolean,
  crmId: String,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### OTPs Collection
```javascript
{
  _id: ObjectId,
  otpId: String (UUID, unique),
  phone: String (indexed),
  name: String,
  email: String,
  otpHash: String,
  isUsed: Boolean,
  attempts: Number,
  expiresAt: Date (TTL index),
  createdAt: Date
}
```

## 🔐 Security Best Practices

1. **Never store plain OTPs** - Always hash with bcrypt
2. **Use TTL indexes** - Auto-delete expired OTPs
3. **Implement rate limiting** - Prevent abuse
4. **Validate all inputs** - Client and server side
5. **Use HTTPS in production** - Encrypt all traffic
6. **Rotate JWT secrets** - Regularly update secrets
7. **Monitor failed attempts** - Log and alert on suspicious activity
8. **Implement CORS** - Whitelist frontend origin only

## 📊 Zoho CRM Integration

### Setup OAuth 2.0
1. Go to https://api-console.zoho.com
2. Create a new client
3. Get Client ID and Client Secret
4. Generate authorization code
5. Exchange for access token and refresh token
6. Update `.env` with credentials

### Data Flow
- After OTP verification → User created in MongoDB
- Async CRM push (non-blocking)
- Retry logic: 3 attempts with exponential backoff
- On failure: Mark `crmSynced: false` for later retry

## 🧪 Testing

### Test Phone Numbers (Sandbox)
- Add your phone number in Meta Developer Console
- Verify via SMS
- Use for testing without template approval

### Test Flow
1. Enter name, phone (+919876543210), email
2. Click "Send OTP via WhatsApp"
3. Receive OTP on WhatsApp
4. Enter 6-digit OTP
5. Verify and redirect to dashboard

## 🚀 Deployment

### Backend (Node.js)
- Deploy to: Heroku, Railway, Render, AWS, DigitalOcean
- Set environment variables
- Enable HTTPS
- Configure CORS with production frontend URL

### Frontend (React)
- Build: `npm run build`
- Deploy to: Vercel, Netlify, AWS S3 + CloudFront
- Update `REACT_APP_API_URL` to production backend URL

### MongoDB
- Use MongoDB Atlas (already configured)
- Enable IP whitelist
- Regular backups

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRY=7d
META_ACCESS_TOKEN=<your-access-token>
META_PHONE_NUMBER_ID=<your-phone-number-id>
META_API_VERSION=v18.0
META_TEMPLATE_NAME=otp_verification
ZOHO_CLIENT_ID=<your-client-id>
ZOHO_CLIENT_SECRET=<your-client-secret>
ZOHO_REFRESH_TOKEN=<your-refresh-token>
FRONTEND_URL=<your-frontend-url>
```

### Frontend (.env)
```
REACT_APP_API_URL=<your-backend-url>/api
REACT_APP_ENV=production
```

## 🐛 Troubleshooting

### WhatsApp OTP not received
- Check phone number format (E.164: +919876543210)
- Verify template is approved (or use sandbox)
- Check access token validity
- Review Meta Developer Console logs

### OTP verification fails
- Check OTP hasn't expired (5 minutes)
- Verify OTP hasn't been used already
- Check rate limiting (max 5 attempts)

### Database connection fails
- Verify MongoDB URI
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### CRM sync fails
- Check Zoho credentials
- Verify OAuth token hasn't expired
- Review retry logs

## 📚 Additional Resources

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Zoho CRM API Docs](https://www.zoho.com/crm/developer/docs/api/v3/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 📄 License

MIT License - Feel free to use for your projects

## 👨‍💻 Author

Built with ❤️ by a Senior Full Stack Engineer

---

**Note:** This is a production-ready system. Always review security settings before deploying to production.
