<p align="center">
  <img src="frontend/public/pvv3.png" alt="PhysioVision logo" width="170" />
</p>

<h1 align="center">
  PhysioVision
</h1>

<p align="center">
  <strong>Remote~ rehabilitation and exercise monitoring</strong><br />
  Move better. Live stronger.
</p>

<p align="center">
  <a href="https://pvv-3.vercel.app/">Live Application</a>
</p>

---

## 1. Problem Description

Rehabilitation exercises need to be performed with appropriate movement
and consistency. Monitoring exercise technique, tracking
repetition-level performance, and reviewing progress across sessions can
be difficult when feedback and records are handled manually. Patients
need convenient access to prescribed exercises, while physiotherapists
need a way to assign exercises and review patient activity.

## 2. Our Solution

PhysioVision is a web-based rehabilitation platform with separate
patient and physiotherapist portals. Physiotherapists can connect with
patients, assign exercises, create custom exercises, and review recorded
sessions. Patients can access prescribed exercises, perform movements
with camera-based pose tracking, and review session scores and history.

The platform brings exercise workflows, pose-based movement analysis,
performance scoring, and session records together in one application.

## 3. Technology Stack

- **Frontend:** React, JavaScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database and data modeling:** MongoDB, Mongoose
- **Pose tracking:** MediaPipe Pose Landmarker
- **Media storage:** Cloudinary
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Deployment:** Vercel-hosted frontend

## 4. Application Workflow

1. A patient connects with a physiotherapist using a connection code or
   is connected through the assignment workflow.
2. The physiotherapist assigns an exercise to the patient.
3. The patient opens an assigned exercise and performs it using the
   camera-based tracking interface.
4. The frontend pose-tracking and exercise-analysis logic processes
   movement and provides available feedback and scores.
5. The session workflow stores available metrics such as completed
   repetitions, repetition scores, duration, and overall score.
6. Patients can review their previous sessions, and physiotherapists
   can review patient progress and completed session reports.

## 5. Project Architecture

The repository contains separate `frontend` and `backend` applications.

```text
PVV3/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── modules/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── package-lock.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── engine/
    │   ├── exercise/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

### Backend (`backend/src`)

- **`config/`** — MongoDB and Cloudinary configuration.
- **`middleware/`** — JWT authentication/role authorization and
  reference image/video upload handling.
- **`models/`** — Mongoose schemas for users, patients,
  physiotherapists, exercises, assignments, sessions, progress,
  connection codes, and session analysis.
- **`modules/`** — Feature-based backend modules. Most modules use a
  consistent controller/routes/service structure:
    - `auth/` — registration, login, and current-user access.
    - `connections/` — patient–physiotherapist connection codes and
      links.
    - `exercise/` — exercise creation and retrieval.
    - `assignment/` — exercise assignment and assignment lists.
    - `session/` — patient exercise session lifecycle and history.
    - `progress/` — patient progress and completed-session retrieval
      for physiotherapists.
    - `physio/` — physiotherapist patient list.
    - `generalizedSessions/` — invite-code sessions, session status,
      and joining.
- **`utils/`** — shared utilities such as Cloudinary uploads.
- **`app.js`** — Express middleware, health endpoint, and API route
  mounting.
- **`server.js`** — environment loading, database connection, and
  HTTP server startup.

### Frontend (`frontend/src`)

- **`components/`** — reusable UI, pose trackers, protected routes,
  connection components, yoga tools, and session report components.
- **`context/`** — shared application state, including
  authentication context.
- **`engine/`** — exercise analysis logic such as calibration,
  geometry, DTW matching, feedback, range-of-motion judging, and
  static-pose handling.
- **`exercise/`** — exercise feature calculation utilities.
- **`pages/`** — login, registration, patient and physiotherapist
  dashboards, exercise sessions, exercise creation, progress, and
  session summary pages.
- **`services/`** — API clients used by the frontend.
- **`public/`** — static assets, including the project logo
  `pvv3.png`.

## 6. API Documentation

All routes below are mounted under the backend API base URL. Replace
`<BASE_URL>` with the deployed backend URL or `http://localhost:5000`
for local development.

### Authentication

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a patient or physiotherapist account. |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT and user profile. |
| `GET` | `/api/auth/me` | Authenticated | Return the current authenticated user payload. |

**Register request example**

```json
{
    "name": "Example User",
    "email": "user@example.com",
    "password": "your-password",
    "role": "PATIENT"
}
```

Allowed role values are `PATIENT` and `PHYSIO`, as used by the backend
authorization logic.

**Login request example**

```json
{
    "email": "user@example.com",
    "password": "your-password"
}
```

For protected endpoints, send the token in the request header:

```http
Authorization: Bearer <JWT>
```

### Physiotherapist and patient connections

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/physio/patients` | `PHYSIO` | Retrieve the physiotherapist's patient list. |
| `POST` | `/api/connections/code` | `PHYSIO` | Generate a patient connection code. |
| `POST` | `/api/connections/connect` | `PATIENT` | Connect using a code. |
| `GET` | `/api/connections/mine` | `PATIENT` | Retrieve the patient's connected physiotherapist. |

**Connect request body**

```json
{
    "code": "PV-XXXXXXXX"
}
```

### Exercises

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/exercises` | Authenticated | Retrieve available exercises. |
| `GET` | `/api/exercises/:id` | Authenticated | Retrieve one exercise by ID. |
| `POST` | `/api/exercises` | `PHYSIO` | Create a custom exercise. |

Exercise creation accepts `multipart/form-data` so reference assets can
be uploaded. Supported fields include `name`, `description`, `category`,
`trackingMode`, `targetHoldSeconds`, `matchThreshold`, and
`configuration`. Optional file fields are `referenceImage` and
`referenceVideo`. The `configuration` field may be JSON text. The
backend validates supported image/video MIME types and uploads provided
assets to Cloudinary.

### Exercise assignments

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assignments` | `PHYSIO` | Assign an exercise to a patient. |
| `GET` | `/api/assignments/my` | `PATIENT` | Retrieve the patient's current assignments. |
| `GET` | `/api/assignments/physio` | `PHYSIO` | Retrieve assignments created by the physiotherapist. |

**Assignment request example**

```json
{
    "patientId": "<PATIENT_ID>",
    "exerciseId": "<EXERCISE_ID>",
    "sets": 3,
    "targetReps": 10,
    "notes": "Follow the prescribed movement."
}
```

### Patient exercise sessions

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sessions/start` | `PATIENT` | Start a session for an assignment. |
| `PATCH` | `/api/sessions/:id/complete` | `PATIENT` | Save completion metrics for a session. |
| `GET` | `/api/sessions/my` | `PATIENT` | Retrieve the patient's session history. |

**Start session request example**

```json
{
    "assignmentId": "<ASSIGNMENT_ID>"
}
```

The completion endpoint accepts session metrics such as `completedReps`,
`averageScore`, `repScores`, `duration`, `targetHoldSeconds`,
`holdDuration`, `poseMatchScore`, `holdCompleted`, and
`validScoreFrames`, as supported by the session service.

### Patient progress (physiotherapist)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/progress/patient/:patientId` | `PHYSIO` | Retrieve progress records for a patient. |
| `GET` | `/api/progress/patient/:patientId/sessions` | `PHYSIO` | Retrieve completed sessions for a patient. |

These routes verify that the requesting physiotherapist has access to
the specified patient.

### Generalized sessions

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/generalized-sessions` | `PHYSIO` | Create an invite-code session. |
| `GET` | `/api/generalized-sessions/mine` | `PHYSIO` | List sessions created by the physiotherapist. |
| `PATCH` | `/api/generalized-sessions/:id/status` | `PHYSIO` | Activate or close a session. |
| `GET` | `/api/generalized-sessions/join/:inviteCode` | Public | Get available session details using an invite code. |
| `POST` | `/api/generalized-sessions/join/:inviteCode` | Public | Join an invite-code session. |

**Create generalized session request example**

```json
{
    "title": "Group Exercise Session",
    "description": "Guided exercise session",
    "exercises": ["<EXERCISE_ID>"],
    "password": "session-password",
    "expiresAt": null
}
```

**Update status request example**

```json
{
    "isActive": true
}
```

**Join session request example**

```json
{
    "password": "session-password",
    "displayName": "Participant"
}
```

### Health check

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Check whether the backend is responding. |

The endpoint returns a JSON status payload when the service is running.

### Authentication and response notes

- Protected endpoints require a valid JWT in the `Authorization`
  header.
- Role-restricted routes require either `PATIENT` or `PHYSIO`, as
  listed above.
- Responses are JSON unless the exercise upload endpoint is receiving
  multipart form data.
- Error responses commonly include a `message` field. Exact status
  codes depend on the endpoint and error condition.

## 7. Installation and Setup

### Prerequisites

- Node.js and npm
- A MongoDB database and connection string
- Cloudinary credentials for reference image/video uploads
- A modern browser with camera access for live pose tracking

### 1. Clone the repository

```bash
git clone https://github.com/viralbhoi/PVV3.git
cd PVV3
```

### 2. Configure and start the backend

Open a terminal in the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

Create a `backend/.env` file containing the backend configuration:

```env
PORT=5000
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
JWT_SECRET=<YOUR_JWT_SECRET>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUDINARY_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_CLOUDINARY_API_SECRET>
```

The backend reads `MONGO_URI` to connect to MongoDB, uses `PORT` (default `5000`) for the server, and uses the three Cloudinary values for media storage. Authentication uses `JWT_SECRET`; set it to a long, private value. Keep the `.env` file local and do not commit it.

Start the backend in development mode:

```bash
npm run dev
```

Or start it without Nodemon:

```bash
npm start
```

The backend should be available at `http://localhost:5000`. Check `http://localhost:5000/api/health` to confirm that it is responding.

### 3. Configure and start the frontend

Open a second terminal in the `frontend` directory:

```bash
cd frontend
npm install
```

The frontend reads `VITE_API_URL` from the Vite environment. Create `frontend/.env` for local development:

```env
VITE_API_URL=http://localhost:5000/api
```

If the backend is hosted elsewhere, set `VITE_API_URL` to that backend's API base URL, including `/api`. Restart the Vite development server after changing environment variables.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal. Allow camera access when testing live exercise tracking.

### Available frontend scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Build the production frontend
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```