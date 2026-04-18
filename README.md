# Campus Attendance System — Express Backend

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT + bcrypt
- **Email**: Nodemailer (Gmail SMTP)

---

## Project Structure

```
src/
├── server.js               # Entry point
├── config/
│   └── prisma.js           # Prisma client singleton
├── controllers/
│   ├── auth.controller.js
│   ├── attendance.controller.js
│   ├── college.controller.js
│   └── report.controller.js
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── geofence.js         # Campus location check (Haversine)
│   ├── deviceCheck.js      # Device fingerprint lock
│   └── errorHandler.js     # Global error handler
├── routes/
│   ├── auth.routes.js
│   ├── attendance.routes.js
│   ├── college.routes.js
│   └── report.routes.js
└── utils/
    └── email.js            # Password reset emails
prisma/
├── schema.prisma           # DB schema
└── seed.js                 # Seed colleges & units
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Edit `.env` with your values:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/attendance_db"
JWT_SECRET=your_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CAMPUS_LATITUDE=-1.2921
CAMPUS_LONGITUDE=36.8219
CAMPUS_RADIUS_METERS=300
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords

### 3. Set up the database
```bash
# Create and run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed colleges and units
npm run db:seed
```

### 4. Start the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register a new student |
| POST | `/login` | ❌ | Login, returns JWT |
| POST | `/forgot-password` | ❌ | Send OTP to email |
| POST | `/reset-password` | ❌ | Reset password with OTP |

**Register body:**
```json
{
  "email": "student@uni.ac.ke",
  "password": "securepass",
  "firstName": "John",
  "lastName": "Doe",
  "regNumber": "CS/001/2023",
  "collegeId": "cuid_here"
}
```

**Login body:**
```json
{ "email": "student@uni.ac.ke", "password": "securepass" }
```

**Forgot Password body:**
```json
{ "email": "student@uni.ac.ke" }
```

**Reset Password body:**
```json
{ "email": "student@uni.ac.ke", "otp": "123456", "newPassword": "newpass" }
```

---

### Colleges — `/api/colleges`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List all colleges |
| GET | `/:collegeId/units` | ❌ | Get units for a college |

---

### Attendance — `/api/attendance`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/check-in` | ✅ JWT | Mark attendance (geofence + device check) |
| GET | `/my` | ✅ JWT | Get own attendance records |

**Check-in body:**
```json
{
  "unitCode": "ISC101",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "deviceInfo": {
    "deviceId": "unique-hardware-id",
    "deviceName": "John's Phone",
    "brand": "Samsung",
    "osName": "Android",
    "osVersion": "13",
    "modelName": "Galaxy A54"
  }
}
```

---

### Reports — `/api/reports`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/summary` | ✅ JWT | Attendance summary grouped by unit |

---

## Security Layers on Check-in

```
POST /api/attendance/check-in
        │
        ▼
[1] verifyToken      → Is the JWT valid?
        │
        ▼
[2] checkGeofence    → Is the student within campus radius?
        │
        ▼
[3] checkDevice      → Is this the student's registered device?
        │
        ▼
[4] checkIn()        → Save attendance record
```

---

## Testing with Postman

1. Register → copy the `token` from response
2. In Postman, set `Authorization: Bearer <token>` header
3. GET `/api/colleges` → copy a `collegeId`
4. POST `/api/attendance/check-in` with campus coordinates + device info
