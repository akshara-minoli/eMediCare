# Telemedicine Service Guide

## What this service does
- Stores telemedicine session records in MongoDB.
- Creates one session per appointment.
- Generates a free Jitsi Meet join URL.
- Supports session states: `scheduled`, `waiting`, `active`, `ended`, `missed`.
- Stores session notes and prescription text when the call ends.

## Free API key note
- No API key is required for the default setup.
- The current implementation uses Jitsi Meet room links.
- If you later want a self-hosted WebRTC stack, you can add TURN/STUN settings, but that is optional.

## Files in this service
- [src/index.js](src/index.js)
- [src/models/session.model.js](src/models/session.model.js)
- [src/controllers/session.controller.js](src/controllers/session.controller.js)
- [src/middleware/validate.middleware.js](src/middleware/validate.middleware.js)
- [src/routes/session.routes.js](src/routes/session.routes.js)
- [.env.example](.env.example)

## Environment variables
Create [services/telemedicine-service/.env](.env) with:

```env
PORT=5008
MONGO_URI=mongodb://localhost:27017/emedicare_telemedicine
```

Optional:

```env
JITSI_DOMAIN=meet.jit.si
JITSI_PREFIX=eMediCare
TURN_SERVER_URL=turn:your-turn-server.com
TURN_USERNAME=username
TURN_PASSWORD=password
```

## API endpoints
### Create session
`POST /api/telemedicine/sessions`

Body:
```json
{
  "appointmentId": "appointment-id",
  "doctorId": "doctor-id",
  "patientId": "patient-id",
  "scheduledAt": "2026-04-15T10:00:00.000Z",
  "type": "video"
}
```

### Create from appointment alias
`POST /api/telemedicine/appointments/:appointmentId/session`

### List sessions
`GET /api/telemedicine/sessions?doctorId=...&patientId=...&status=...&appointmentId=...`

### Get session by id
`GET /api/telemedicine/sessions/:id`

### Get session by room
`GET /api/telemedicine/sessions/room/:roomId`

### Load join details
`GET /api/telemedicine/sessions/:id/join`

### Mark waiting
`PATCH /api/telemedicine/sessions/:id/waiting`

### Start call
`PATCH /api/telemedicine/sessions/:id/start`

### End call
`PATCH /api/telemedicine/sessions/:id/end`

Body:
```json
{
  "notes": "Patient is recovering well",
  "prescription": "Paracetamol 500mg"
}
```

## How the flow works
1. Patient books a video appointment from the doctors page.
2. Appointment is stored in the appointment service.
3. Doctor accepts the appointment.
4. Doctor opens the video consultation tab and starts consultation.
5. Doctor service calls telemedicine service to create a session.
6. Telemedicine page shows the session.
7. Patient or doctor clicks Join Call, which opens the Jitsi room.
8. Doctor ends the session and the service stores duration, notes, and prescription.

## Local run
From project root:

```powershell
docker compose up -d --build telemedicine-service api-gateway frontend doctor-service appointment-service
```

Health checks:

```powershell
Invoke-RestMethod http://localhost:5008/health
Invoke-RestMethod http://localhost:8080/health
```

## Demo checklist
- Doctor dashboard can create a telemedicine session.
- Patient telemedicine page can list sessions.
- Join Call opens a browser meeting room.
- End Session updates the record in MongoDB.
