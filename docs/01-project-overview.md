# PhysioVision

A web-based physiotherapy exercise management and pose-tracking platform that helps physiotherapists assign exercises, monitor patient sessions, and review exercise performance.

## Project Links

- **GitHub Repository:** https://github.com/viralbhoi/PVV3
- **Live Application:** https://pvv-3.vercel.app/

## 1. Project Overview

PhysioVision is designed to support the interaction between physiotherapists and their patients through a centralized exercise management and progress-tracking platform.

Physiotherapists can manage connected patients, create exercises, assign exercise routines, and review patient performance. Patients can access their assigned exercises, perform sessions using browser-based pose tracking, and review their progress over time.

The platform combines a role-based web application with a client-side pose-tracking engine. The tracking engine uses camera input and pose landmarks to evaluate exercise movements and provide feedback during sessions.

The application focuses on making exercise monitoring more structured and accessible while reducing the need for continuous manual observation during every exercise session.

## 2. Problem Statement

Physiotherapy exercises often require patients to perform movements repeatedly while maintaining correct posture, range of motion, and movement patterns.

Traditional exercise monitoring can involve several challenges:

- Physiotherapists may not be able to observe every exercise session in real time.
- Patients may perform exercises incorrectly when practising independently.
- Tracking exercise completion and consistency manually can be inconvenient.
- Reviewing patient progress across multiple sessions can require maintaining separate records.
- Generic exercise applications may not provide a workflow connecting physiotherapists, assigned exercises, and patient performance records.

PhysioVision addresses these challenges by providing a platform where physiotherapists can manage exercise assignments and review session-level performance data collected through browser-based pose tracking.

## 3. Project Objectives

The primary objectives of PhysioVision are:

1. Provide separate interfaces and workflows for physiotherapists and patients.
2. Enable physiotherapists to connect with and manage their patients.
3. Allow physiotherapists to create exercises and assign them to patients.
4. Support reference media for exercises, including images and videos.
5. Track exercise movements using browser-based pose estimation.
6. Provide real-time visual and audio feedback during supported exercise sessions.
7. Support both dynamic exercises and static pose-hold exercises.
8. Store completed session metrics and exercise performance summaries.
9. Provide patient progress information to both patients and authorized physiotherapists.
10. Support generalized exercise sessions that participants can join through an invitation workflow.

## 4. User Roles

### 4.1 Physiotherapist

The physiotherapist is responsible for managing patients and organizing their exercise routines.

Key capabilities include:

- Registering and logging into the platform.
- Viewing the physiotherapist dashboard.
- Generating patient connection codes.
- Connecting and managing patients.
- Browsing available exercises.
- Creating custom exercises.
- Uploading exercise reference images and videos.
- Assigning exercises to connected patients.
- Creating generalized exercise sessions.
- Reviewing patient exercise history and progress.
- Accessing session performance reports.

### 4.2 Patient

The patient uses the platform to access assigned exercises and perform exercise sessions.

Key capabilities include:

- Registering and logging into the platform.
- Connecting with a physiotherapist using a connection code.
- Viewing assigned exercises.
- Starting an assigned exercise session.
- Performing supported exercises using browser-based pose tracking.
- Receiving feedback during exercise execution.
- Viewing completed session summaries.
- Reviewing personal exercise progress.
- Joining generalized exercise sessions through an invitation workflow.

## 5. Core Features

### 5.1 Authentication and Role-Based Access

PhysioVision provides registration and login functionality for physiotherapists and patients.

The application maintains role-specific access so that users interact with the features relevant to their account type.

Authenticated requests are protected through token-based authentication.

### 5.2 Patient–Physiotherapist Connection

The platform provides a connection workflow between physiotherapists and patients.

A physiotherapist can generate a connection code, which a patient can use to establish a connection. Once connected, the physiotherapist can manage the patient's exercise assignments and review relevant progress information.

### 5.3 Exercise Management

Physiotherapists can browse available exercises and create custom exercises.

Exercise configuration can include information such as:

- Exercise name and description.
- Exercise category.
- Tracking mode.
- Target hold duration for static exercises.
- Matching threshold.
- Exercise-specific configuration.
- Reference image or video.

Reference media is uploaded through the backend and stored using Cloudinary.

### 5.4 Exercise Assignment

Physiotherapists can assign exercises to connected patients.

An assignment connects a patient with an exercise and can include a target repetition count.

Patients can view their assigned exercises and initiate sessions based on those assignments.

### 5.5 Browser-Based Pose Tracking

The pose-tracking engine runs in the frontend using MediaPipe Tasks Vision.

It uses camera input to identify body landmarks and calculate movement-related features. These features are evaluated by the exercise-tracking logic to determine movement progress and provide feedback.

Depending on the exercise configuration, tracking can support dynamic movements or static pose holds.

### 5.6 Real-Time Exercise Feedback

During supported exercise sessions, the application provides feedback based on the tracking results.

The feedback system can include:

- Visual feedback.
- Audio feedback.
- Movement and posture evaluation.
- Repetition tracking.
- Static hold timing.
- Exercise performance scoring.

The exact evaluation process depends on the tracking mode and exercise-specific configuration.

### 5.7 Session Recording and Analysis

When a patient completes an exercise session, the frontend submits the session metrics to the backend.

The backend records information such as:

- Session start and completion timestamps.
- Session duration.
- Completed repetitions.
- Repetition-level scores.
- Average performance score.
- Accuracy.
- Form consistency.
- Session summary.

The stored information supports later progress analysis.

### 5.8 Patient Progress Monitoring

PhysioVision maintains exercise progress information based on completed sessions.

Patients can review their own exercise history and progress.

Physiotherapists can access progress information for their connected patients, subject to the application's access checks.

### 5.9 Generalized Exercise Sessions

The platform also supports generalized exercise sessions.

A physiotherapist can create a session and share its invitation details with participants. Participants can join through an invite code and password.

This provides a separate workflow for organizing exercise sessions involving multiple participants.

### 5.10 Static Yoga Pose Tracking

In addition to dynamic exercise tracking, the platform includes support for static yoga poses.

Static pose tracking evaluates pose-related features and uses a hold timer to track how long a participant maintains a supported pose.

## 6. Main Application Workflows

### 6.1 Physiotherapist Workflow

1. The physiotherapist registers or logs into the application.
2. The physiotherapist accesses the dashboard.
3. The physiotherapist generates a patient connection code.
4. A patient uses the code to establish a connection.
5. The physiotherapist browses existing exercises or creates a custom exercise.
6. Reference media and exercise configuration can be added when required.
7. The physiotherapist assigns an exercise to a connected patient.
8. The physiotherapist monitors the patient's exercise history and progress.
9. The physiotherapist reviews completed session information.

### 6.2 Patient Workflow

1. The patient registers or logs into the application.
2. The patient connects with a physiotherapist using a connection code.
3. The patient opens the dashboard.
4. The patient views assigned exercises.
5. The patient starts an exercise session.
6. The browser requests camera access when pose tracking is required.
7. The frontend processes pose information and evaluates exercise movements.
8. The patient receives feedback during the session.
9. The session metrics are submitted to the backend.
10. The patient can review the completed session and progress information.

### 6.3 Custom Exercise Creation Workflow

1. The physiotherapist opens the exercise creation interface.
2. The physiotherapist enters the exercise details.
3. The physiotherapist selects the appropriate tracking mode.
4. Exercise-specific configuration is provided.
5. Reference images or videos can be uploaded.
6. The frontend sends the exercise information and media to the backend.
7. The backend processes the request and stores the exercise.
8. Uploaded reference assets are stored using Cloudinary.

### 6.4 Exercise Session Workflow

1. The patient selects an assigned exercise.
2. The frontend initiates the session through the backend.
3. The browser-based tracking engine starts processing camera input.
4. Pose landmarks and movement features are calculated.
5. The exercise-specific evaluation logic processes the features.
6. Feedback and session metrics are updated during execution.
7. When the exercise is completed, the frontend submits the final metrics.
8. The backend completes the session, stores its analysis, and updates progress information.

## 7. Technology Stack

| Layer                | Technology             | Responsibility                           |
| -------------------- | ---------------------- | ---------------------------------------- |
| Frontend framework   | React                  | User interface and application workflows |
| Frontend tooling     | Vite                   | Development server and production build  |
| Styling              | Tailwind CSS v4        | UI styling                               |
| Programming language | JavaScript             | Frontend and backend application logic   |
| Backend runtime      | Node.js                | Server-side execution                    |
| Backend framework    | Express.js             | REST API and request handling            |
| Database             | MongoDB                | Persistent application data              |
| ODM                  | Mongoose               | Database schemas and model operations    |
| Pose estimation      | MediaPipe Tasks Vision | Browser-based pose landmark detection    |
| Authentication       | JWT                    | Authenticated request handling           |
| Password hashing     | bcrypt                 | Password hashing                         |
| Media storage        | Cloudinary             | Exercise reference media storage         |
| Frontend deployment  | Vercel                 | Hosting the frontend application         |

## 8. High-Level System Responsibilities

PhysioVision is divided into distinct application responsibilities.

### 8.1 Frontend

The React frontend is responsible for:

- Rendering user interfaces.
- Managing authentication state.
- Handling role-specific dashboards.
- Communicating with backend APIs.
- Managing exercise creation and assignment workflows.
- Accessing the browser camera when required.
- Running pose tracking and exercise evaluation.
- Displaying real-time feedback.
- Presenting session summaries and progress information.

### 8.2 Backend

The Node.js and Express backend is responsible for:

- Handling HTTP requests.
- Authenticating and authorizing users.
- Managing patient and physiotherapist relationships.
- Managing exercises and assignments.
- Creating and completing exercise sessions.
- Persisting session analysis.
- Maintaining aggregated progress records.
- Handling exercise reference media uploads.
- Managing generalized exercise sessions.

### 8.3 Database

MongoDB stores the application's persistent information.

Mongoose provides the schemas, models, validation, and database operations used by the backend.

The database stores user information, patient and physiotherapist profiles, exercises, assignments, sessions, session analysis, and progress records.

### 8.4 Pose-Tracking Engine

The pose-tracking engine is implemented on the frontend.

It processes camera input in the browser, extracts pose landmarks, calculates movement-related features, and evaluates exercise performance.

The standard tracking workflow processes camera frames locally in the browser. The backend receives session metrics and analysis information rather than a continuous stream of raw camera frames.

## 9. Scope and Limitations

PhysioVision is a software platform intended to support physiotherapy exercise management and performance monitoring.

The following limitations should be considered:

- Pose-tracking accuracy depends on camera quality, lighting, body visibility, device performance, and camera positioning.
- Browser camera access requires user permission.
- Tracking behavior depends on the exercise configuration and the evaluation logic implemented for that exercise.
- Incorrect camera positioning or partially visible body landmarks can affect tracking results.
- Performance scores and feedback should be interpreted as application-generated measurements, not definitive clinical assessments.
- The application does not diagnose medical conditions or independently prescribe treatment.
- PhysioVision is not a replacement for professional physiotherapy assessment or clinical judgment.
- The application should not be described as clinically validated unless supported by a separate formal validation study.

A separate Python-based machine-learning experiment has also been explored during development. It is distinct from the deployed web application's standard browser-based pose-tracking workflow and should not be treated as an integrated component of the production request path.

## 10. Documentation Structure

The remaining documentation files cover the implementation in greater detail.

| File                            | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `01-project-overview.md`        | Project purpose, features, workflows, and technology stack        |
| `02-system-architecture.md`     | Overall system architecture and component interactions            |
| `03-backend-architecture.md`    | Backend structure, modules, controllers, services, and middleware |
| `04-frontend-architecture.md`   | Frontend structure, pages, components, context, and services      |
| `05-database-design.md`         | MongoDB models, relationships, and data organization              |
| `06-api-reference.md`           | Backend API endpoints, request formats, and responses             |
| `07-pose-tracking-engine.md`    | Pose estimation, feature calculation, evaluation, and feedback    |
| `08-authentication-security.md` | Authentication, authorization, and security mechanisms            |
| `09-deployment-guide.md`        | Environment configuration and deployment process                  |
| `10-engineering-decisions.md`   | Important implementation decisions, trade-offs, and limitations   |
