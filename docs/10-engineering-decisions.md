# Engineering Decisions

## 1. Introduction

This document records the major architectural and engineering decisions
behind PhysioVision.

PhysioVision is a full-stack physiotherapy exercise management and
tracking application. Its implementation combines a React frontend, a
Node.js and Express backend, MongoDB persistence, browser-based pose
tracking, and external media storage.

The decisions documented here explain the reasoning behind the
application's structure and the trade-offs associated with its design.

Where a decision is based on the current implementation, it is described
as an implemented architectural choice. Where the available project
information does not establish the exact rationale or configuration,
that limitation is stated rather than inventing a historical decision.

---

## 2. Technology Stack

The application uses the following technologies:

---

Area Technology Responsibility

---

Frontend React Component-based user
interface

Frontend tooling Vite Development server and
production build

Styling Tailwind CSS Frontend styling

Backend Node.js Backend runtime

API framework Express.js HTTP API and routing

Database MongoDB Persistent application
data

Data modeling Mongoose MongoDB schemas and
models

Authentication JWT Token-based
authentication

Password security bcrypt Password hashing

Pose tracking MediaPipe Tasks Vision Browser-side pose
landmark detection

Reference media Cloudinary Exercise image and
video storage

Frontend hosting Vercel Frontend deployment

---

The technologies are used in separate layers so that user interface
rendering, API processing, persistence, and pose tracking have clear
responsibilities.

---

## 3. Frontend and Backend Separation

### Decision

The application uses a separate React frontend and Node.js/Express
backend rather than combining all application logic into a single
server-rendered application.

### Implementation

The repository separates the two applications:

```text
PVV3/
├── frontend/
└── backend/
```

The frontend handles:

- User interfaces.
- Navigation and page rendering.
- Authentication state.
- Camera access.
- Pose tracking and exercise evaluation.
- Session metric submission.

The backend handles:

- Authentication endpoints.
- Patient and physiotherapist workflows.
- Exercise management.
- Exercise assignments.
- Session management.
- Progress and analysis persistence.
- Reference asset uploads.

### Rationale

This separation keeps frontend interaction logic independent from
backend business logic.

It also allows the frontend and backend to be developed, configured, and
deployed independently.

### Trade-offs

- Both applications require separate dependency and environment
  configuration.
- API contracts must remain consistent between frontend and backend.
- Cross-origin communication must be configured correctly when
  deployed on different origins.

---

## 4. Client-Side Pose Processing

### Decision

The standard pose tracking workflow performs pose detection and exercise
evaluation in the browser.

### Implementation

The frontend uses MediaPipe Tasks Vision to process camera input and
obtain pose landmarks.

The frontend engine then performs the relevant geometry calculations,
feature extraction, movement evaluation, repetition or hold tracking,
and feedback generation.

Relevant source areas:

```text
frontend/src/
├── components/
│   ├── PoseTracker.jsx
│   ├── StaticYogaPoseTracker.jsx
│   └── StaticYogaHoldPanel.jsx
├── engine/
└── exercise/
    └── featureCalculator.js
```

The backend receives structured session results rather than continuously
processing the raw camera stream in the standard tracking workflow.

### Rationale

Pose tracking requires repeated processing while an exercise is being
performed. Keeping this computation in the browser avoids making the
backend responsible for the continuous real-time camera-processing loop.

It also reduces the need to transmit raw camera frames to the backend.

### Trade-offs

- Tracking performance depends on the user's device and browser.
- Camera permissions and browser compatibility are required.
- Lighting, camera placement, and body visibility affect landmark
  quality.
- Different devices may provide different real-time processing
  performance.

---

## 5. Separate Dynamic and Static Exercise Workflows

### Decision

Dynamic repetition-based exercises and static pose-holding exercises use
separate evaluation workflows.

### Implementation

Dynamic tracking is associated with:

```text
frontend/src/components/PoseTracker.jsx
frontend/src/engine/geometry.js
frontend/src/engine/ROMJudge.js
frontend/src/engine/FeedbackEngine.js
frontend/src/exercise/featureCalculator.js
```

Static pose tracking is associated with:

```text
frontend/src/components/StaticYogaPoseTracker.jsx
frontend/src/components/StaticYogaHoldPanel.jsx
frontend/src/engine/staticPoseFeatures.js
frontend/src/engine/StaticPoseJudge.js
frontend/src/engine/StaticHoldTimer.js
```

### Rationale

The two exercise types have different evaluation requirements.

- Dynamic exercises involve movement progression and repetition
  tracking.
- Static exercises involve pose evaluation and maintaining a position
  for a duration.

Keeping these workflows separate avoids forcing both exercise types into
a single evaluation model.

### Trade-offs

- Some shared pose-processing concepts may need to be implemented or
  coordinated across separate workflows.
- Supporting a new exercise mode may require additional evaluation
  logic and frontend integration.

---

## 6. Modular Pose Tracking Engine

### Decision

Pose tracking functionality is divided into focused modules rather than
being implemented entirely inside one React component.

### Implementation

The engine contains modules with distinct responsibilities:

Module Responsibility

---

`geometry.js` Geometric calculations
`featureCalculator.js` Exercise feature extraction
`Calibrator.js` Calibration functionality
`ReferenceImageCalibrator.js` Reference-image calibration
`ReferenceVideoCalibrator.js` Reference-video calibration
`DTWMatcher.js` Sequence matching using DTW
`ROMJudge.js` Range-of-motion evaluation
`FeedbackEngine.js` Feedback generation
`StaticHoldTimer.js` Static hold timing
`staticPoseFeatures.js` Static pose feature extraction
`StaticPoseJudge.js` Static pose evaluation

### Rationale

Separating these responsibilities makes the tracking logic easier to
understand and maintain.

It also allows individual parts of the tracking workflow to evolve
without requiring all logic to be rewritten in the main React component.

### Trade-offs

- More modules introduce additional interfaces and dependencies.
- Changes to shared feature representations may affect multiple engine
  modules.
- Module boundaries need to remain clear as new exercises are added.

---

## 7. MongoDB and Mongoose

### Decision

The backend uses MongoDB with Mongoose for application data persistence.

### Implementation

The backend maintains separate models for major application entities,
including:

- `User`
- `Patient`
- `Physiotherapist`
- `Exercise`
- `ExerciseAssignment`
- `ExerciseSession`
- `SessionAnalysis`
- `Progress`
- `PatientConnectionCode`
- `GeneralizedSession`

### Rationale

The application has multiple related entities with different data
responsibilities.

Mongoose provides schema definitions, model-based database operations,
and document relationships for the MongoDB data layer.

### Trade-offs

- Data relationships and ownership checks must be handled carefully in
  application services.
- Related data may require population or multiple database operations.
- Schema changes must be coordinated with existing application data
  and API behavior.

---

## 8. Service-Oriented Backend Modules

### Decision

Backend functionality is organized into feature-oriented modules with
controller, route, and service responsibilities.

### Implementation

The backend contains modules for:

```text
backend/src/modules/
├── assignment/
├── auth/
├── connections/
├── exercise/
├── generalizedSessions/
├── physio/
├── progress/
└── session/
```

The backend also separates shared concerns:

```text
backend/src/
├── config/
├── middleware/
├── models/
└── utils/
```

### Rationale

Feature-oriented organization keeps related API behavior together.

Separating routes, controllers, and services helps distinguish HTTP
handling from application operations and data-related workflows.

### Trade-offs

- A request may pass through several files before reaching its data
  operation.
- Shared behavior must be placed carefully to avoid duplication or
  circular dependencies.
- Module boundaries need to be maintained as features grow.

---

## 9. JWT Authentication and bcrypt Password Hashing

### Decision

The application uses JWT-based authentication and bcrypt for password
hashing.

### Implementation

Authentication responsibilities are separated across the frontend and
backend.

Frontend:

```text
frontend/src/
├── context/AuthContext.jsx
├── components/ProtectedRoute.jsx
├── pages/Login.jsx
└── pages/Register.jsx
```

Backend:

```text
backend/src/
├── middleware/auth.js
├── modules/auth/
└── models/User.js
```

### Rationale

JWT provides a mechanism for identifying authenticated users across API
requests.

bcrypt allows passwords to be stored as hashes rather than plain-text
values.

The frontend authentication context centralizes authentication state,
while protected routes manage access to pages that require
authentication.

### Trade-offs

- Token handling and storage require careful security consideration.
- Backend authorization must be enforced independently of frontend
  route protection.
- JWT expiration, renewal, and storage behavior must be maintained
  consistently with the implementation.

---

## 10. Backend Persistence of Session Results

### Decision

The frontend performs live tracking, while the backend persists
completed session information and updates analysis and progress records.

### Implementation

The session lifecycle uses:

```http
POST /api/sessions/start
PATCH /api/sessions/:id/complete
```

The backend session service handles session creation and completion.

The completion workflow records relevant session metrics, creates or
updates session analysis, and updates progress information.

### Rationale

This separation avoids coupling the real-time tracking loop to database
operations.

The frontend can focus on collecting and evaluating movement data, while
the backend maintains durable session records and progress history.

### Trade-offs

- The frontend and backend must agree on the session completion
  contract.
- Failed completion requests need to be handled without losing the
  user's session result.
- Session state transitions and assignment ownership must be validated
  by the backend.

---

## 11. Cloudinary for Exercise Reference Assets

### Decision

Exercise reference images and videos are stored using Cloudinary rather
than being treated as ordinary application database records.

### Implementation

Relevant backend files:

```text
backend/src/config/cloudinary.js
backend/src/utils/uploadToCloudinary.js
backend/src/middleware/uploadExerciseAssets.js
```

Exercise records maintain the information needed to associate reference
media with exercises.

### Rationale

A dedicated media service handles uploaded image and video assets, while
MongoDB remains responsible for application data and references to those
assets.

### Trade-offs

- The application depends on Cloudinary availability and
  configuration.
- Upload workflows need to handle external service failures.
- Media credentials must be protected through backend environment
  configuration.

---

## 12. Vercel and Single-Page Application Routing

### Decision

The React frontend is deployed on Vercel, with rewrite configuration for
client-side routing.

### Implementation

The frontend includes:

```text
frontend/vercel.json
```

Configuration:

```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

### Rationale

React Router handles nested routes in the browser. When a user directly
opens or refreshes a nested route, the hosting platform must serve the
application entry point.

The rewrite ensures that frontend routes are resolved by the React
application instead of returning a hosting-platform 404.

### Engineering Outcome

The rewrite configuration resolved the direct-navigation issue
encountered with the generalized sessions route:

```text
/physio/generalized-sessions
```

The deployed generalized session route and join workflow subsequently
worked.

### Trade-offs

- Rewrite rules must be configured carefully so that they do not
  interfere with static assets or API routing.
- Hosting configuration must remain aligned with the frontend routing
  strategy.

---

## 13. Generalized Exercise Sessions

### Decision

PhysioVision includes a generalized session workflow in addition to
individual patient exercise assignments.

### Implementation

The backend has a dedicated module:

```text
backend/src/modules/generalizedSessions/
```

The frontend includes:

```text
frontend/src/pages/
├── GeneralizedSessions.jsx
├── JoinGeneralizedSession.jsx
└── GeneralizedSessionExercise.jsx
```

The workflow supports session creation, invite-based discovery, and
participant joining.

### Rationale

The generalized session workflow supports a group-oriented exercise
experience rather than limiting the application to one-to-one patient
assignments.

### Trade-offs

- Group participation introduces additional session lifecycle and
  access-control requirements.
- Invite and joining workflows need validation.
- The frontend deployment must support direct navigation to the
  relevant routes.

The exact concurrency behavior, participant limits, and session
synchronization guarantees should be verified against the implementation
before being documented as system guarantees.

---

## 14. Explicit Separation of the Standalone ML Experiment

### Decision

The separate Python-based machine learning experiment is not treated as
part of the deployed web application's live pose-tracking request path.

### Implementation

The deployed web application uses the React frontend, MediaPipe Tasks
Vision, and frontend tracking modules for its standard live exercise
workflow.

The separate Python experiment is an independent project activity.

### Rationale

Keeping the distinction clear prevents the architecture from incorrectly
implying that the deployed web application sends live camera frames to a
Python ML service.

### Trade-offs

- Research or experimental ML improvements are not automatically
  available in the deployed tracking workflow.
- Integrating a future ML model would require an explicit architecture
  and deployment decision.

---

## 15. Engineering Trade-Offs

The major architectural choices involve practical trade-offs.

---

Decision Benefit Trade-off

---

Separate frontend and Independent development Requires stable API
backend and deployment contracts and
cross-origin
configuration

Browser-side pose Keeps live tracking Depends on client
processing computation near camera device and browser
input performance

Separate dynamic and Exercise-mode-specific Requires multiple
static tracking evaluation coordinated workflows

Modular tracking engine Easier maintenance and More module interfaces
extension to maintain

MongoDB with Mongoose Model-based persistence Relationship and
for application entities ownership logic remains
important

JWT authentication Token-based API Token lifecycle and
authentication storage need careful
handling

Cloudinary media Dedicated service for External service
storage reference assets dependency

Vercel SPA rewrites Supports direct Hosting rules must
navigation to nested match frontend routing
routes

---

---

## 16. Decisions to Revisit as the Project Evolves

The following areas may require further engineering work as the
application grows. They are potential future review topics, not claims
that a migration or implementation has already been completed.

### 16.1 Tracking Performance

Evaluate pose-processing performance across different devices and
browsers.

### 16.2 Exercise Configuration

Consider how new exercises can be added while keeping exercise-specific
features, evaluation rules, and feedback maintainable.

### 16.3 Session Reliability

Review how incomplete sessions, interrupted camera access, and failed
completion requests should be handled.

### 16.4 Backend Scalability

Review database indexing, API performance, and service boundaries as the
number of users and stored sessions increases.

### 16.5 Security Hardening

Review token lifecycle, rate limiting, input validation, resource
authorization, and production configuration.

### 16.6 ML Integration

If the separate ML experiment is integrated into the web application in
the future, define its runtime location, input/output contract,
deployment requirements, and performance implications explicitly.

---

## 17. Summary

PhysioVision uses a modular full-stack architecture designed to separate
user interface behavior, backend business logic, persistent data, and
real-time pose tracking.

The main engineering decisions include:

- Separating the React frontend from the Express backend.
- Running the standard pose tracking workflow in the browser.
- Maintaining distinct dynamic and static exercise evaluation paths.
- Organizing tracking functionality into focused modules.
- Using MongoDB and Mongoose for persistence.
- Structuring backend functionality by feature.
- Using JWT and bcrypt for authentication.
- Persisting completed session metrics through backend services.
- Using Cloudinary for exercise reference assets.
- Configuring Vercel rewrites for React Router navigation.
- Keeping the standalone Python ML experiment separate from the
  deployed tracking architecture.

These decisions establish the current technical structure of
PhysioVision while leaving room for future improvements in tracking
performance, security, scalability, and exercise support.
