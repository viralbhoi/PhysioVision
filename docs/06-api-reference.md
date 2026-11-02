# API Reference

## 1. Introduction

PhysioVision exposes a REST API through its Node.js and Express backend.

The API acts as the communication layer between the React frontend and the backend application. It handles authentication, patient–physiotherapist connections, exercise management, assignments, exercise sessions, progress retrieval, and generalized exercise sessions.

The frontend communicates with the backend using HTTP requests. Protected endpoints require JWT-based authentication, and role-restricted endpoints additionally enforce the appropriate user role.

This document describes the available API endpoints, access requirements, request formats, and their responsibilities.

## 2. API Configuration

### 2.1 Base URL

All API endpoints are mounted under the backend API base URL.

```text
<BASE_URL>
```

For local development, the default base URL is:

```text
http://localhost:5000
```

Replace `<BASE_URL>` with the deployed backend URL when using the production application.

### 2.2 Request Format

Most API requests use JSON.

For JSON requests, include the following header:

```http
Content-Type: application/json
```

The exercise creation endpoint uses `multipart/form-data` because it supports image and video uploads.

### 2.3 Authentication Header

Protected endpoints require a valid JWT.

Include the token in the HTTP Authorization header:

```http
Authorization: Bearer <JWT>
```

The backend validates the token and identifies the authenticated user before processing protected operations.

### 2.4 Access Levels

The API uses the following access categories:

| Access Level  | Description                                       |
| ------------- | ------------------------------------------------- |
| Public        | Endpoint can be accessed without authentication   |
| Authenticated | Requires a valid JWT                              |
| PATIENT       | Requires an authenticated patient account         |
| PHYSIO        | Requires an authenticated physiotherapist account |

Role-restricted endpoints must be accessed using an account with the appropriate role.

## 3. API Endpoint Overview

The following table provides an overview of the backend API.

| Module               | Method | Endpoint                                     | Access        |
| -------------------- | ------ | -------------------------------------------- | ------------- |
| Authentication       | POST   | `/api/auth/register`                         | Public        |
| Authentication       | POST   | `/api/auth/login`                            | Public        |
| Authentication       | GET    | `/api/auth/me`                               | Authenticated |
| Physiotherapist      | GET    | `/api/physio/patients`                       | PHYSIO        |
| Connections          | POST   | `/api/connections/code`                      | PHYSIO        |
| Connections          | POST   | `/api/connections/connect`                   | PATIENT       |
| Connections          | GET    | `/api/connections/mine`                      | PATIENT       |
| Exercises            | GET    | `/api/exercises`                             | Authenticated |
| Exercises            | GET    | `/api/exercises/:id`                         | Authenticated |
| Exercises            | POST   | `/api/exercises`                             | PHYSIO        |
| Assignments          | POST   | `/api/assignments`                           | PHYSIO        |
| Assignments          | GET    | `/api/assignments/my`                        | PATIENT       |
| Assignments          | GET    | `/api/assignments/physio`                    | PHYSIO        |
| Sessions             | POST   | `/api/sessions/start`                        | PATIENT       |
| Sessions             | PATCH  | `/api/sessions/:id/complete`                 | PATIENT       |
| Sessions             | GET    | `/api/sessions/my`                           | PATIENT       |
| Progress             | GET    | `/api/progress/patient/:patientId`           | PHYSIO        |
| Progress             | GET    | `/api/progress/patient/:patientId/sessions`  | PHYSIO        |
| Generalized Sessions | POST   | `/api/generalized-sessions`                  | PHYSIO        |
| Generalized Sessions | GET    | `/api/generalized-sessions/mine`             | PHYSIO        |
| Generalized Sessions | PATCH  | `/api/generalized-sessions/:id/status`       | PHYSIO        |
| Generalized Sessions | GET    | `/api/generalized-sessions/join/:inviteCode` | Public        |
| Generalized Sessions | POST   | `/api/generalized-sessions/join/:inviteCode` | Public        |
| Health               | GET    | `/api/health`                                | Public        |

---

## 4. Authentication APIs

Authentication endpoints are responsible for registering users, validating login credentials, and retrieving authenticated user information.

### 4.1 Register User

**Endpoint:**

```http
POST /api/auth/register
```

**Access:** Public

**Description:**

Creates a new user account for a patient or physiotherapist.

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
    "name": "Example User",
    "email": "user@example.com",
    "password": "your-password",
    "role": "PATIENT"
}
```

**Supported Roles:**

- `PATIENT`
- `PHYSIO`

**Processing Flow:**

1. Receive registration details.
2. Validate the submitted information.
3. Hash the password using bcrypt.
4. Create the user account.
5. Create the corresponding role-specific profile.
6. Return the registration result.

**Response:**

The endpoint returns a JSON response indicating the registration result.

The exact response fields depend on the authentication controller implementation.

### 4.2 Login User

**Endpoint:**

```http
POST /api/auth/login
```

**Access:** Public

**Description:**

Authenticates a user using their email address and password.

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "your-password"
}
```

**Processing Flow:**

1. Receive login credentials.
2. Find the user account using the email address.
3. Verify the submitted password against the stored bcrypt hash.
4. Generate a JWT for successful authentication.
5. Return the authentication result and user information.

**Response:**

The successful login response provides the JWT and user profile information.

The exact response structure should be taken from the current authentication controller.

### 4.3 Get Current User

**Endpoint:**

```http
GET /api/auth/me
```

**Access:** Authenticated

**Description:**

Retrieves information about the currently authenticated user.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Processing Flow:**

1. Receive the request.
2. Validate the JWT through authentication middleware.
3. Identify the authenticated user.
4. Return the current user information.

**Response:**

Returns the authenticated user's information.

---

## 5. Physiotherapist APIs

### 5.1 Get Physiotherapist Patients

**Endpoint:**

```http
GET /api/physio/patients
```

**Access:** `PHYSIO`

**Description:**

Retrieves the list of patients associated with the authenticated physiotherapist.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Resolve the physiotherapist profile.
3. Retrieve the associated patients.
4. Return the patient information.

**Response:**

Returns the physiotherapist's patient list.

---

## 6. Patient Connection APIs

The connection module manages the relationship between patients and physiotherapists.

It uses connection codes to allow patients to establish a relationship with a physiotherapist.

### 6.1 Generate Connection Code

**Endpoint:**

```http
POST /api/connections/code
```

**Access:** `PHYSIO`

**Description:**

Generates a connection code that can be shared with a patient.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:**

No request body is specified in the API documentation.

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Generate a connection code.
3. Store the connection code information.
4. Return the generated code.

**Response:**

Returns the generated patient connection code.

### 6.2 Connect Patient

**Endpoint:**

```http
POST /api/connections/connect
```

**Access:** `PATIENT`

**Description:**

Connects a patient with a physiotherapist using a valid connection code.

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**

```json
{
    "code": "PV-XXXXXXXX"
}
```

**Processing Flow:**

1. Authenticate the patient.
2. Receive the submitted connection code.
3. Validate the code.
4. Establish the patient–physiotherapist relationship.
5. Return the connection result.

**Response:**

Returns the result of the connection operation.

### 6.3 Get Patient Connection

**Endpoint:**

```http
GET /api/connections/mine
```

**Access:** `PATIENT`

**Description:**

Retrieves the physiotherapist connected to the authenticated patient.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the patient's connected physiotherapist information.

---

## 7. Exercise APIs

The exercise module manages exercise definitions and custom exercise creation.

### 7.1 Get All Exercises

**Endpoint:**

```http
GET /api/exercises
```

**Access:** Authenticated

**Description:**

Retrieves the available exercise catalogue.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the available exercise records.

### 7.2 Get Exercise by ID

**Endpoint:**

```http
GET /api/exercises/:id
```

**Access:** Authenticated

**Description:**

Retrieves an individual exercise using its MongoDB document ID.

**Path Parameter:**

| Parameter | Description                |
| --------- | -------------------------- |
| `id`      | MongoDB ID of the exercise |

**Example:**

```http
GET /api/exercises/EXERCISE_ID
```

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the requested exercise information.

### 7.3 Create Custom Exercise

**Endpoint:**

```http
POST /api/exercises
```

**Access:** `PHYSIO`

**Description:**

Creates a custom exercise with its configuration and optional reference media.

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

**Request Format:**

The endpoint accepts `multipart/form-data`.

**Supported Text Fields:**

| Field               | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `name`              | Exercise name                                                      |
| `description`       | Exercise description                                               |
| `category`          | Exercise category                                                  |
| `trackingMode`      | Exercise tracking mode                                             |
| `targetHoldSeconds` | Target duration for supported static exercises                     |
| `matchThreshold`    | Matching threshold used by supported tracking workflows            |
| `configuration`     | Exercise-specific configuration, potentially provided as JSON text |

**Optional File Fields:**

| Field            | Description                      |
| ---------------- | -------------------------------- |
| `referenceImage` | Reference image for the exercise |
| `referenceVideo` | Reference video for the exercise |

**Example Text Data:**

```text
name: Shoulder Exercise
description: Example exercise description
category: Upper Body
trackingMode: DYNAMIC
targetHoldSeconds: 30
matchThreshold: 0.85
configuration: {"example": "value"}
```

**Upload Processing Flow:**

1. Authenticate the physiotherapist.
2. Receive multipart form data.
3. Process uploaded reference files through upload middleware.
4. Validate supported image and video MIME types.
5. Upload provided media to Cloudinary.
6. Store exercise information and media references in MongoDB.
7. Return the created exercise information.

**Response:**

Returns the result of exercise creation.

The exact response structure depends on the exercise controller implementation.

---

## 8. Exercise Assignment APIs

The assignment module manages exercises assigned by physiotherapists to patients.

### 8.1 Create Exercise Assignment

**Endpoint:**

```http
POST /api/assignments
```

**Access:** `PHYSIO`

**Description:**

Assigns an exercise to a patient.

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**

```json
{
    "patientId": "<PATIENT_ID>",
    "exerciseId": "<EXERCISE_ID>",
    "sets": 3,
    "targetReps": 10,
    "notes": "Follow the prescribed movement."
}
```

**Request Fields:**

| Field        | Description                                |
| ------------ | ------------------------------------------ |
| `patientId`  | ID of the patient receiving the assignment |
| `exerciseId` | ID of the assigned exercise                |
| `sets`       | Number of sets                             |
| `targetReps` | Target repetitions                         |
| `notes`      | Additional assignment instructions         |

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Receive the patient and exercise identifiers.
3. Validate the relevant records and access relationship.
4. Create the exercise assignment.
5. Return the assignment result.

**Response:**

Returns the created assignment information.

### 8.2 Get Patient Assignments

**Endpoint:**

```http
GET /api/assignments/my
```

**Access:** `PATIENT`

**Description:**

Retrieves the exercise assignments belonging to the authenticated patient.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the patient's exercise assignments.

### 8.3 Get Physiotherapist Assignments

**Endpoint:**

```http
GET /api/assignments/physio
```

**Access:** `PHYSIO`

**Description:**

Retrieves the exercise assignments created by the authenticated physiotherapist.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the physiotherapist's assignment records.

---

## 9. Exercise Session APIs

The session module manages the lifecycle of individual patient exercise sessions.

It handles session initialization, completion, and retrieval of session history.

### 9.1 Start Exercise Session

**Endpoint:**

```http
POST /api/sessions/start
```

**Access:** `PATIENT`

**Description:**

Creates a new exercise session using an existing exercise assignment.

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**

```json
{
    "assignmentId": "<ASSIGNMENT_ID>"
}
```

**Processing Flow:**

1. Authenticate the patient.
2. Resolve the patient's profile.
3. Find the requested assignment belonging to that patient.
4. Retrieve the associated exercise.
5. Create an ExerciseSession record.
6. Store the session start timestamp.
7. Store the target repetition count.
8. Update the assignment status to `IN_PROGRESS`.
9. Return the created session.

**Response:**

Returns the created exercise session information.

### 9.2 Complete Exercise Session

**Endpoint:**

```http
PATCH /api/sessions/:id/complete
```

**Access:** `PATIENT`

**Description:**

Completes an existing exercise session and persists the performance metrics calculated by the frontend.

**Path Parameter:**

| Parameter | Description                        |
| --------- | ---------------------------------- |
| `id`      | MongoDB ID of the exercise session |

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Supported Metrics:**

The completion service supports session metrics including:

| Field               | Description                              |
| ------------------- | ---------------------------------------- |
| `completedReps`     | Number of completed repetitions          |
| `averageScore`      | Average exercise performance score       |
| `repScores`         | Repetition-level scores                  |
| `duration`          | Session duration                         |
| `targetHoldSeconds` | Target static hold duration              |
| `holdDuration`      | Actual hold duration                     |
| `poseMatchScore`    | Pose matching score                      |
| `holdCompleted`     | Indicates whether the hold was completed |
| `validScoreFrames`  | Number of valid scoring frames           |

The fields used depend on the exercise tracking mode and the session workflow.

**Example Request Body:**

```json
{
    "completedReps": 10,
    "averageScore": 85,
    "repScores": [80, 85, 90, 82, 88],
    "duration": 600
}
```

This is an illustrative dynamic-exercise request. Static exercise workflows can submit the corresponding hold-related metrics.

**Processing Flow:**

1. Authenticate the patient.
2. Resolve the patient's profile.
3. Retrieve the requested session while checking patient ownership.
4. Update the completion timestamp.
5. Store session duration and completion metrics.
6. Mark the session as `COMPLETED`.
7. Create or update the SessionAnalysis record.
8. Update the patient's Progress record.
9. Return the completion result.

**Response:**

Returns the session completion result.

The exact response structure should be taken from the current session controller.

### 9.3 Get Patient Session History

**Endpoint:**

```http
GET /api/sessions/my
```

**Access:** `PATIENT`

**Description:**

Retrieves exercise session history for the authenticated patient.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the patient's session records.

---

## 10. Patient Progress APIs

The progress module provides access to patient progress and completed exercise session information.

These endpoints are intended for physiotherapists and perform patient access verification.

### 10.1 Get Patient Progress

**Endpoint:**

```http
GET /api/progress/patient/:patientId
```

**Access:** `PHYSIO`

**Description:**

Retrieves aggregated exercise progress records for a specified patient.

**Path Parameter:**

| Parameter   | Description               |
| ----------- | ------------------------- |
| `patientId` | MongoDB ID of the patient |

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Resolve the requested patient.
3. Verify that the physiotherapist is authorized to access the patient.
4. Retrieve the patient's progress records.
5. Populate associated exercise information.
6. Return the progress information.

**Response:**

Returns progress records associated with the patient.

### 10.2 Get Patient Completed Sessions

**Endpoint:**

```http
GET /api/progress/patient/:patientId/sessions
```

**Access:** `PHYSIO`

**Description:**

Retrieves completed exercise sessions belonging to a specified patient.

**Path Parameter:**

| Parameter   | Description               |
| ----------- | ------------------------- |
| `patientId` | MongoDB ID of the patient |

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Verify access to the specified patient.
3. Retrieve completed exercise sessions.
4. Populate associated exercise information.
5. Sort the sessions by completion timestamp.
6. Return the session history.

**Response:**

Returns completed exercise session records for the requested patient.

---

## 11. Generalized Session APIs

The generalized session module supports invitation-based exercise sessions.

Physiotherapists can create sessions and participants can access them through an invite code and password.

### 11.1 Create Generalized Session

**Endpoint:**

```http
POST /api/generalized-sessions
```

**Access:** `PHYSIO`

**Description:**

Creates a generalized exercise session with invitation details.

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**

```json
{
    "title": "Group Exercise Session",
    "description": "Guided exercise session",
    "exercises": ["<EXERCISE_ID>"],
    "password": "session-password",
    "expiresAt": null
}
```

**Request Fields:**

| Field         | Description                               |
| ------------- | ----------------------------------------- |
| `title`       | Generalized session title                 |
| `description` | Session description                       |
| `exercises`   | List of exercise identifiers              |
| `password`    | Password used for the invitation workflow |
| `expiresAt`   | Optional session expiration information   |

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Receive generalized session information.
3. Create the generalized session.
4. Generate or associate invitation details.
5. Store the session.
6. Return the session creation result.

**Response:**

Returns the created generalized session information.

### 11.2 Get Physiotherapist Generalized Sessions

**Endpoint:**

```http
GET /api/generalized-sessions/mine
```

**Access:** `PHYSIO`

**Description:**

Retrieves generalized sessions created by the authenticated physiotherapist.

**Request Headers:**

```http
Authorization: Bearer <JWT>
```

**Request Body:** None

**Response:**

Returns the physiotherapist's generalized session records.

### 11.3 Update Generalized Session Status

**Endpoint:**

```http
PATCH /api/generalized-sessions/:id/status
```

**Access:** `PHYSIO`

**Description:**

Updates the active status of a generalized session.

**Path Parameter:**

| Parameter | Description                           |
| --------- | ------------------------------------- |
| `id`      | MongoDB ID of the generalized session |

**Request Headers:**

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**

```json
{
    "isActive": true
}
```

**Processing Flow:**

1. Authenticate the physiotherapist.
2. Identify the generalized session.
3. Validate access to the session.
4. Update the session status.
5. Return the updated session information.

### 11.4 Get Session Details Using Invite Code

**Endpoint:**

```http
GET /api/generalized-sessions/join/:inviteCode
```

**Access:** Public

**Description:**

Retrieves available generalized session information using an invitation code.

**Path Parameter:**

| Parameter    | Description                                             |
| ------------ | ------------------------------------------------------- |
| `inviteCode` | Invitation code associated with the generalized session |

**Example:**

```http
GET /api/generalized-sessions/join/INVITE_CODE
```

**Request Body:** None

**Response:**

Returns the available session information required by the joining workflow.

### 11.5 Join Generalized Session

**Endpoint:**

```http
POST /api/generalized-sessions/join/:inviteCode
```

**Access:** Public

**Description:**

Allows a participant to join a generalized session using its invitation code and password.

**Path Parameter:**

| Parameter    | Description                                 |
| ------------ | ------------------------------------------- |
| `inviteCode` | Invitation code associated with the session |

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
    "password": "session-password",
    "displayName": "Participant"
}
```

**Request Fields:**

| Field         | Description                                      |
| ------------- | ------------------------------------------------ |
| `password`    | Password associated with the generalized session |
| `displayName` | Participant display name                         |

**Processing Flow:**

1. Receive the invitation code.
2. Retrieve the corresponding generalized session.
3. Validate the submitted password.
4. Process the participant join request.
5. Return the join result.

**Response:**

Returns the result of the participant joining operation.

---

## 12. Health Check API

### 12.1 Check Backend Availability

**Endpoint:**

```http
GET /api/health
```

**Access:** Public

**Description:**

Checks whether the backend service is responding.

**Request Body:** None

**Response:**

Returns a JSON status payload when the backend is running.

This endpoint can be used to verify basic backend availability.

---

## 13. Authentication and Authorization

### 13.1 JWT Authentication

Protected endpoints require a valid JWT.

The frontend includes the token in the Authorization header:

```http
Authorization: Bearer <JWT>
```

The authentication middleware validates the token and makes authenticated user information available to downstream route handlers.

### 13.2 Role-Based Authorization

The backend restricts operations according to the authenticated user's role.

Examples:

| Operation                         | Required Role |
| --------------------------------- | ------------- |
| Create exercise                   | `PHYSIO`      |
| Create exercise assignment        | `PHYSIO`      |
| Generate patient connection code  | `PHYSIO`      |
| Retrieve physiotherapist patients | `PHYSIO`      |
| Start exercise session            | `PATIENT`     |
| Complete exercise session         | `PATIENT`     |
| Retrieve patient assignments      | `PATIENT`     |
| Connect with physiotherapist      | `PATIENT`     |

### 13.3 Resource-Level Authorization

Some operations require additional checks beyond role validation.

Examples include:

- A patient can start a session only from an assignment belonging to that patient.
- A patient can complete only a session belonging to that patient.
- A physiotherapist can retrieve patient progress only when authorized to access that patient.
- A physiotherapist's patient list is resolved using the authenticated physiotherapist identity.

These checks are performed by backend logic rather than relying exclusively on frontend route restrictions.

---

## 14. Error Handling

The backend returns JSON responses for API operations.

Error responses commonly include a `message` field describing the error.

The exact HTTP status code depends on the endpoint and error condition.

Common error scenarios include:

| Scenario                    | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| Invalid credentials         | Login credentials cannot be authenticated                     |
| Missing authentication      | Protected endpoint called without a valid JWT                 |
| Invalid role                | User attempts an operation outside their permitted role       |
| Invalid connection code     | Submitted patient connection code cannot be validated         |
| Missing patient             | Patient profile cannot be found                               |
| Missing exercise            | Requested exercise does not exist                             |
| Invalid assignment          | Assignment cannot be found or does not belong to the patient  |
| Invalid session             | Requested session cannot be found                             |
| Unauthorized patient access | Physiotherapist does not have access to the requested patient |
| Invalid invitation          | Generalized session invitation details cannot be validated    |
| Upload failure              | Reference media upload cannot be completed                    |

The frontend should handle unsuccessful responses and display appropriate feedback to the user.

---

## 15. API Integration Examples

The following examples illustrate how the frontend can communicate with the backend.

### 15.1 Login Request

```javascript
const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        email: "user@example.com",
        password: "your-password",
    }),
});

const data = await response.json();
```

### 15.2 Authenticated API Request

```javascript
const response = await fetch(`${BASE_URL}/api/assignments/my`, {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const data = await response.json();
```

### 15.3 Start Exercise Session

```javascript
const response = await fetch(`${BASE_URL}/api/sessions/start`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
        assignmentId: assignmentId,
    }),
});

const data = await response.json();
```

### 15.4 Complete Exercise Session

```javascript
const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}/complete`, {
    method: "PATCH",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
        completedReps: 10,
        averageScore: 85,
        repScores: [80, 85, 90],
        duration: 600,
    }),
});

const data = await response.json();
```

### 15.5 Create Exercise With Reference Media

```javascript
const formData = new FormData();

formData.append("name", "Shoulder Exercise");
formData.append("description", "Example exercise description");
formData.append("category", "Upper Body");
formData.append("trackingMode", "DYNAMIC");
formData.append(
    "configuration",
    JSON.stringify({
        example: "value",
    }),
);

formData.append("referenceImage", imageFile);
formData.append("referenceVideo", videoFile);

const response = await fetch(`${BASE_URL}/api/exercises`, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
    },
    body: formData,
});

const data = await response.json();
```

The browser automatically sets the multipart content type and boundary when a FormData object is supplied. Do not manually set the `Content-Type` header for this request.

---

## 16. API Design Considerations

### 16.1 REST-Based Communication

The backend exposes resources through HTTP endpoints and uses HTTP methods to represent operations.

- `GET` retrieves resources.
- `POST` creates resources or submits operations.
- `PATCH` updates selected resource information.

### 16.2 Centralized Authentication

Authentication is handled through JWT middleware.

This allows protected endpoints to reuse the same authentication mechanism.

### 16.3 Role-Based Access Control

The backend enforces role restrictions for physiotherapist and patient operations.

This keeps authorization rules on the server rather than depending only on frontend navigation.

### 16.4 Separation of Tracking and Persistence

The frontend performs pose detection and calculates exercise metrics.

The backend receives the resulting session information through the session completion API.

This avoids requiring continuous camera-frame uploads during the standard exercise session workflow.

### 16.5 Modular API Organization

API endpoints are grouped according to their functional modules:

- Authentication.
- Connections.
- Physiotherapist operations.
- Exercises.
- Assignments.
- Sessions.
- Progress.
- Generalized sessions.

This organization keeps related operations together and makes the API easier to maintain.

## 17. API Documentation Notes

This reference documents the API contract information available in the PhysioVision project documentation.

The following details should be verified directly against the current route, controller, middleware, and service implementations before treating this document as an exhaustive machine-readable API specification:

- Exact response JSON structures.
- Exact HTTP status codes.
- All field-level validation constraints.
- Optional versus required request fields.
- Query parameters and pagination behavior.
- Complete upload size and MIME-type restrictions.
- Exact error messages.
- Generalized session participant persistence details.
- Any additional endpoints not listed in this reference.

The backend implementation remains the source of truth for the final API contract.

## 18. Summary

PhysioVision exposes REST APIs for authentication, patient connections, exercise management, assignments, exercise sessions, progress monitoring, and generalized exercise sessions.

The frontend uses these APIs to manage application data and communicate with the backend.

JWT authentication protects private endpoints, while role-based authorization separates patient and physiotherapist operations.

The exercise session APIs are particularly important because they connect the browser-based pose-tracking engine with persistent backend records. The frontend calculates exercise performance metrics, and the backend stores the completed session, its analysis, and aggregated progress information.
