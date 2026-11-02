# Pose Tracking Engine

## 1. Introduction

The PhysioVision pose tracking engine is a browser-based component
responsible for tracking a patient's body movements during exercise
sessions.

It uses **MediaPipe Tasks Vision** to process camera input and obtain
pose landmarks. These landmarks are used by the frontend engine to
calculate geometric features, evaluate exercise movements, track
repetitions or static holds, and provide feedback.

The pose tracking engine runs primarily on the client side. The backend
stores session results and progress information rather than processing
the continuous camera stream.

The engine supports two broad exercise workflows:

-   **Dynamic exercises:** Exercises involving repeated movements, where
    the system evaluates movement patterns and tracks repetitions.
-   **Static exercises:** Exercises involving maintaining a particular
    pose for a specified duration, including supported yoga pose
    workflows.

## 2. Design Goals

1.  **Real-time processing:** Process camera input continuously during
    an exercise session.
2.  **Client-side computation:** Perform pose detection and movement
    evaluation in the browser.
3.  **Exercise-specific evaluation:** Support different movement
    patterns instead of applying one generic rule to every exercise.
4.  **Movement validation:** Evaluate movement features and range of
    motion before accepting exercise progress.
5.  **Feedback:** Provide visual and audio feedback during exercise
    sessions.
6.  **Session integration:** Convert tracking results into structured
    metrics that can be persisted by the backend.
7.  **Multiple exercise modes:** Support both dynamic repetition-based
    exercises and static pose-holding exercises.

## 3. High-Level Processing Pipeline

The tracking workflow can be represented as follows:

``` mermaid
flowchart TD
    A[Camera Input] --> B[MediaPipe Pose Detection]
    B --> C[Pose Landmarks]
    C --> D[Geometry and Feature Calculation]
    D --> E{Exercise Mode}
    E -->|Dynamic| F[Movement Evaluation]
    E -->|Static| G[Static Pose Evaluation]
    F --> H[Repetition Tracking]
    G --> I[Hold Timer]
    H --> J[Feedback Engine]
    I --> J
    J --> K[Session Metrics]
    K --> L[Backend Session Completion API]
    L --> M[Database Persistence]
```

### 3.1 Camera Input

The browser obtains camera access after the user grants the required
permission. The camera stream supplies frames to the pose tracking
component. Camera availability, device performance, lighting, and the
patient's position can affect tracking quality.

### 3.2 Pose Detection

MediaPipe Tasks Vision processes the camera input and produces pose
landmarks. These landmarks represent detected body keypoints and provide
the input for subsequent geometric calculations.

### 3.3 Geometry and Feature Calculation

The detected landmarks are processed to derive useful movement
information, such as:

-   Joint angles.
-   Relative body positions.
-   Distances between relevant landmarks.
-   Exercise-specific movement features.

The exact features depend on the exercise being performed.

### 3.4 Exercise Evaluation

The calculated features are passed to the appropriate evaluation logic.
Dynamic exercises use movement evaluation and repetition tracking, while
static exercises use pose evaluation and hold-duration logic.

### 3.5 Feedback and Session Metrics

The engine provides feedback during the exercise and maintains relevant
session metrics. When the session is completed, the frontend sends the
resulting metrics to the backend for persistence.

## 4. Runtime Architecture

The pose tracking engine is implemented inside the React frontend.

``` text
frontend/
└── src/
    ├── components/
    │   ├── PoseTracker.jsx
    │   ├── StaticYogaHoldPanel.jsx
    │   ├── StaticYogaPoseTracker.jsx
    │   └── ExerciseReferenceMedia.jsx
    │
    ├── engine/
    │   ├── Calibrator.js
    │   ├── DTWMatcher.js
    │   ├── FeedbackEngine.js
    │   ├── geometry.js
    │   ├── ReferenceImageCalibrator.js
    │   ├── ReferenceVideoCalibrator.js
    │   ├── ROMJudge.js
    │   ├── StaticHoldTimer.js
    │   ├── staticPoseFeatures.js
    │   └── StaticPoseJudge.js
    │
    └── exercise/
        └── featureCalculator.js
```

### 4.1 Client-Side Processing Boundary

  Responsibility                   Location
  -------------------------------- ----------
  Camera access                    Browser
  Pose landmark detection          Frontend
  Geometric calculations           Frontend
  Exercise feature extraction      Frontend
  Movement evaluation              Frontend
  Repetition and hold tracking     Frontend
  Real-time feedback               Frontend
  Session result persistence       Backend
  Progress and history retrieval   Backend

Raw camera frames are processed locally in the standard tracking
workflow. The application sends session metrics and completion
information to the backend rather than continuously uploading the camera
stream.

This reduces unnecessary backend processing and keeps the real-time
tracking workflow close to the user.

## 5. Core Engine Modules

The engine is divided into smaller modules so that pose processing,
movement evaluation, calibration, and feedback remain separate
responsibilities.

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `geometry.js`                       Provides geometric calculations
                                      used to interpret pose landmarks.

  `featureCalculator.js`              Derives exercise-related features
                                      from pose information.

  `Calibrator.js`                     Provides calibration functionality
                                      for the tracking workflow.

  `ReferenceImageCalibrator.js`       Supports calibration using
                                      reference images.

  `ReferenceVideoCalibrator.js`       Supports calibration using
                                      reference videos.

  `DTWMatcher.js`                     Provides dynamic time warping-based
                                      sequence matching functionality.

  `ROMJudge.js`                       Evaluates range-of-motion-related
                                      movement information.

  `FeedbackEngine.js`                 Handles feedback generation for the
                                      tracking workflow.

  `StaticHoldTimer.js`                Handles timing logic for static
                                      hold exercises.

  `staticPoseFeatures.js`             Extracts features used in static
                                      pose evaluation.

  `StaticPoseJudge.js`                Evaluates static pose information.
  -----------------------------------------------------------------------

The React components connect these engine modules to the user interface
and exercise-session workflow.

### 5.1 Geometry Module

**File:** `frontend/src/engine/geometry.js`

Pose landmarks alone are not sufficient to evaluate an exercise. The
application needs to interpret their spatial relationships.

The geometry module provides calculations used to derive meaningful
information from landmark coordinates, such as joint angles, relative
positions, distances between body landmarks, and geometric relationships
relevant to an exercise.

These calculations form the foundation for exercise-specific feature
extraction.

### 5.2 Feature Calculator

**File:** `frontend/src/exercise/featureCalculator.js`

The feature calculator transforms pose information into features that
can be consumed by the exercise evaluation logic.

Different exercises depend on different body movements and geometric
relationships. Rather than coupling all exercise logic directly to raw
landmarks, the application can work with derived features.

### 5.3 Calibration Modules

The calibration-related modules support the preparation and evaluation
of exercise references. The project includes `Calibrator.js`,
`ReferenceImageCalibrator.js`, and `ReferenceVideoCalibrator.js`.

These modules provide support for calibration workflows involving
exercise references. The precise calibration parameters and matching
rules should be documented alongside the corresponding implementation
rather than assumed to be identical across all exercises.

### 5.4 DTW Matcher

**File:** `frontend/src/engine/DTWMatcher.js`

Dynamic Time Warping (DTW) is a sequence-matching technique that can
compare movement sequences despite differences in execution speed.

The project includes a DTW matcher as part of its reference and
movement-matching functionality. Sequence matching is useful when two
people perform the same movement at different speeds. A direct
frame-by-frame comparison may not align corresponding movement stages,
whereas temporal alignment can provide a more flexible comparison.

The exact distance function, sequence representation, and matching
thresholds are implementation-specific.

### 5.5 Range of Motion Judge

**File:** `frontend/src/engine/ROMJudge.js`

Range of motion is an important aspect of exercise evaluation. The ROM
judge is responsible for evaluating movement information related to
range of motion.

It works as part of the exercise evaluation layer rather than directly
controlling camera access or database persistence.

### 5.6 Feedback Engine

**File:** `frontend/src/engine/FeedbackEngine.js`

The feedback engine handles feedback generation during the tracking
workflow. Feedback is intended to help users understand their exercise
performance while performing movements.

The frontend includes visual and audio feedback capabilities.

### 5.7 Static Pose Modules

Static pose tracking uses `staticPoseFeatures.js`, `StaticPoseJudge.js`,
and `StaticHoldTimer.js`. These modules separate static pose feature
extraction, pose evaluation, and hold-duration management from the
dynamic repetition workflow.

## 6. Dynamic Exercise Tracking

Dynamic exercises involve repeated movements, such as squats or other
exercises where the patient moves through a sequence of positions.

The main frontend component associated with this workflow is
`frontend/src/components/PoseTracker.jsx`.

### 6.1 Workflow

A typical dynamic exercise session follows this conceptual sequence:

1.  The patient opens an assigned exercise.
2.  The frontend initializes the tracking workflow.
3.  The browser obtains camera access.
4.  MediaPipe detects pose landmarks.
5.  The application calculates geometric and exercise-specific features.
6.  The movement evaluation logic examines the detected movement.
7.  Repetition tracking determines whether a valid repetition has been
    completed.
8.  The feedback engine provides relevant feedback.
9.  Session metrics are updated.
10. The completed session is submitted to the backend.

### 6.2 Repetition Tracking

A repetition-based exercise requires more than detecting a single body
position. The system needs to interpret movement progression and
determine whether the required movement has been completed.

The tracking workflow therefore evaluates movement over time rather than
treating every detected frame as a completed repetition.

``` text
Start Exercise
      |
      v
Initialize Tracking
      |
      v
Detect Pose Landmarks
      |
      v
Calculate Exercise Features
      |
      v
Evaluate Movement
      |
      v
Update Repetition State
      |
      +---- Valid movement completed?
      |              |
      |              v
      |        Update Rep Count
      |
      v
Generate Feedback
      |
      v
Continue Tracking
      |
      v
Complete Session
```

The exact movement phases, transition conditions, and validation
thresholds are exercise-specific and should be verified against the
corresponding implementation.

### 6.3 Repetition Metrics

The dynamic tracking workflow supports session-level information such as
completed repetitions, individual repetition scores, average score, and
session duration. These values can be included in the session completion
request.

## 7. Static Yoga and Hold Tracking

Not every exercise involves repeated movement. Some exercises require a
patient to maintain a particular body position for a specified duration.

PhysioVision includes a separate static pose workflow.

``` text
frontend/src/components/
├── StaticYogaPoseTracker.jsx
└── StaticYogaHoldPanel.jsx

frontend/src/engine/
├── staticPoseFeatures.js
├── StaticPoseJudge.js
└── StaticHoldTimer.js
```

### 7.1 Static Pose Workflow

1.  The patient starts a static exercise.
2.  Camera input is processed to detect pose landmarks.
3.  Static pose features are extracted.
4.  The static pose judge evaluates the detected pose.
5.  The hold timer manages the exercise duration.
6.  The frontend presents the relevant tracking feedback.
7.  Completion information is included in the session result.

### 7.2 Static Pose Evaluation

Static pose evaluation focuses on whether the detected body position
satisfies the requirements of the selected pose.

Unlike dynamic exercises, the main objective is not to identify repeated
movement cycles. The static pose feature extraction and evaluation
modules keep this workflow separate from the dynamic repetition-based
logic.

### 7.3 Hold Duration

The `StaticHoldTimer.js` module manages hold-related timing.

The session completion workflow supports information such as:

-   Target hold duration.
-   Actual hold duration.
-   Whether the hold was completed.
-   Pose match score.
-   Number of valid score frames.

The backend stores the submitted session information for later reporting
and progress tracking.

## 8. Reference Media and Calibration

PhysioVision supports exercise reference media, including reference
images and videos.

Relevant frontend files:

``` text
frontend/src/components/
├── ExerciseReferenceMedia.jsx
└── ReferenceVideoCalibrator.jsx
```

Engine modules:

``` text
frontend/src/engine/
├── Calibrator.js
├── ReferenceImageCalibrator.js
└── ReferenceVideoCalibrator.js
```

### 8.1 Reference Images

Reference images can be used as part of the exercise reference and
calibration workflow. The reference image calibrator provides the
corresponding calibration functionality.

### 8.2 Reference Videos

Reference videos provide a temporal representation of an exercise. The
application includes a reference-video calibration workflow and a DTW
matcher module for sequence-matching functionality.

### 8.3 Reference Asset Storage

Exercise reference assets are uploaded through the backend and stored
using Cloudinary. The frontend uses the associated exercise reference
media as part of the exercise experience.

The reference media workflow is separate from the live camera processing
workflow.

## 9. Scoring and Feedback

The tracking engine produces information that can be used to evaluate
exercise performance. The project includes movement evaluation,
range-of-motion evaluation, reference matching, and feedback modules.

### 9.1 Exercise Evaluation

The evaluation process uses derived pose features rather than relying
exclusively on raw camera frames.

Depending on the exercise workflow, the evaluation can involve:

-   Geometric relationships between landmarks.
-   Movement-related features.
-   Range-of-motion information.
-   Reference-based movement matching.
-   Static pose evaluation.

The exact evaluation logic depends on the selected exercise and its
configuration.

### 9.2 Session Scoring

The session completion workflow supports metrics such as:

  -----------------------------------------------------------------------
  Metric                              Description
  ----------------------------------- -----------------------------------
  `completedReps`                     Number of completed repetitions.

  `averageScore`                      Average score associated with the
                                      exercise session.

  `repScores`                         Scores recorded for individual
                                      repetitions.

  `poseMatchScore`                    Pose matching score for supported
                                      static workflows.

  `validScoreFrames`                  Number of valid score frames
                                      submitted for supported tracking
                                      workflows.
  -----------------------------------------------------------------------

These are session-level values, not a claim that every exercise uses
every metric.

### 9.3 Feedback

The `FeedbackEngine.js` module handles feedback generation. The frontend
can present feedback through visual and audio mechanisms.

Feedback is intended to assist the patient during exercise execution. It
should not be interpreted as a clinical diagnosis or a replacement for
professional supervision.

## 10. Integration with the Backend

The pose tracking engine operates in the frontend, but its results are
integrated with the backend session-management system.

### 10.1 Session Lifecycle

**Starting a session**

The frontend requests a session through:

``` http
POST /api/sessions/start
```

The backend creates a session associated with the patient and their
assigned exercise.

**Completing a session**

After tracking is complete, the frontend submits the session result
through:

``` http
PATCH /api/sessions/:id/complete
```

The completion request supports fields such as:

``` json
{
  "completedReps": 10,
  "averageScore": 85,
  "repScores": [],
  "duration": 120,
  "targetHoldSeconds": 30,
  "holdDuration": 30,
  "poseMatchScore": 85,
  "holdCompleted": true,
  "validScoreFrames": 100
}
```

This is an illustrative representation of supported completion fields,
not a requirement to send every field in every request. Values must
reflect the actual tracking result.

### 10.2 Backend Processing

The backend session service is responsible for persisting session
completion information.

The completion workflow includes:

1.  Updating the exercise session.
2.  Recording completion-related metrics.
3.  Creating or updating the associated session analysis.
4.  Updating patient progress information.

The frontend tracking engine therefore remains independent of database
persistence while still contributing the information required for
progress reporting.

### 10.3 Data Flow

``` mermaid
sequenceDiagram
    participant P as Patient
    participant F as React Frontend
    participant M as MediaPipe
    participant E as Pose Engine
    participant B as Express Backend
    participant D as MongoDB

    P->>F: Start exercise
    F->>B: POST /api/sessions/start
    B->>D: Create session
    B-->>F: Session information

    loop During exercise
        F->>M: Process camera frame
        M-->>F: Pose landmarks
        F->>E: Evaluate pose and movement
        E-->>F: Tracking metrics and feedback
    end

    P->>F: Complete exercise
    F->>B: PATCH /api/sessions/:id/complete
    B->>D: Persist session and analysis
    B->>D: Update progress
    B-->>F: Completion response
```

## 11. Camera and Environment Constraints

The tracking engine depends on camera input and successful pose
detection. The quality of tracking can be affected by several
environmental factors.

### 11.1 Camera Permission

The browser must receive camera permission before the tracking workflow
can operate. If permission is denied, the application cannot obtain the
required camera stream.

### 11.2 Lighting

Poor lighting can reduce the quality of pose detection. Adequate and
consistent lighting helps the pose detection system identify body
landmarks.

### 11.3 Body Visibility

The patient's body should remain sufficiently visible to the camera.
Partial visibility, unsuitable camera placement, and obstruction can
affect the landmarks available to the evaluation logic.

### 11.4 Device Performance

Pose detection and feature calculations require browser-side processing.
Performance may vary depending on the device, browser, camera, and
available computing resources.

### 11.5 Tracking Reliability

The application depends on detected landmarks. If landmarks are missing,
unstable, or inaccurate, subsequent geometric calculations and exercise
evaluation can also become unreliable.

The tracking result should therefore be interpreted in the context of
camera and environmental conditions.

## 12. Performance and Privacy Considerations

### 12.1 Client-Side Processing

The standard tracking workflow performs pose detection and exercise
evaluation in the browser.

This approach offers several advantages:

-   Avoids continuously transmitting raw camera frames to the backend.
-   Reduces server-side computation for real-time tracking.
-   Keeps the tracking loop close to the camera input.
-   Allows the backend to focus on persistence and reporting.

### 12.2 Backend Responsibilities

The backend receives structured session information rather than acting
as the primary real-time pose-processing engine. This keeps the tracking
and persistence responsibilities separate.

### 12.3 Reference Media

Exercise reference images and videos are handled through the exercise
asset upload workflow, which uses Cloudinary. These assets should be
distinguished from the patient's live camera stream.

## 13. Limitations and Non-Goals

The pose tracking engine is an application-level exercise tracking
system. Its output should be interpreted with the following limitations.

### 13.1 Not a Medical Diagnostic System

PhysioVision does not diagnose medical conditions.

### 13.2 Not an Automated Treatment Prescription System

The application does not replace a physiotherapist's professional
judgment or independently prescribe treatment.

### 13.3 No Established Clinical Validation Claim

The existence of pose tracking, scoring, and feedback functionality does
not establish clinical accuracy or medical efficacy.

### 13.4 Camera-Dependent Results

Tracking quality depends on camera placement, lighting, body visibility,
device performance, and pose detection quality.

### 13.5 Exercise-Specific Logic

Different exercises can require different features and evaluation rules.
A single universal scoring rule should not be assumed.

### 13.6 Separate Machine Learning Experiment

The project also involved a separate Python-based machine learning
experiment.

That experiment should not be confused with the deployed browser-based
pose tracking pipeline. The live web application's tracking workflow
uses the frontend implementation and MediaPipe Tasks Vision.

## 14. Summary

The PhysioVision pose tracking engine is a client-side movement
evaluation system built around MediaPipe Tasks Vision.

Its architecture separates the major responsibilities:

-   MediaPipe-based pose landmark detection.
-   Geometric calculations and feature extraction.
-   Calibration and reference matching.
-   Dynamic movement and range-of-motion evaluation.
-   Static pose evaluation and hold timing.
-   Feedback generation.
-   Session metric submission.

The separation between the frontend tracking engine and backend
session-management system allows real-time exercise processing to take
place in the browser while preserving structured session results,
analysis, and patient progress in the backend.

This modular design also makes the tracking system easier to extend with
additional exercises, reference workflows, and evaluation logic.
