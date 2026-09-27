/**
 * PhysioGeometry
 *
 * Stateless biomechanical geometry engine.
 *
 * Input:
 *   MediaPipe 3D world landmarks
 *
 * Output:
 *   Anatomical joint angles + plane angles
 */

class PhysioGeometry {
    /**
     * Calculate the angle ABC in 3D space.
     *
     * Formula:
     * theta = acos((BA · BC) / (|BA| |BC|))
     *
     * @param {Object} a
     * @param {Object} b
     * @param {Object} c
     * @returns {number}
     */
    static getAngle(a, b, c) {
        const ba = {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        };

        const bc = {
            x: c.x - b.x,
            y: c.y - b.y,
            z: c.z - b.z,
        };

        const normBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);

        const normBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

        // Avoid division by zero
        if (normBA === 0 || normBC === 0) {
            return 0;
        }

        const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;

        let cosine = dot / (normBA * normBC);

        // Floating-point protection
        cosine = Math.max(-1, Math.min(1, cosine));

        const angle = Math.acos(cosine);

        return (angle * 180) / Math.PI;
    }

    /**
     * Create a virtual midpoint between two landmarks.
     */
    static midpoint(a, b) {
        return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            z: (a.z + b.z) / 2,
            visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
        };
    }

    /**
     * Calculate all standard PhysioVision angles.
     *
     * MediaPipe Pose landmark indices:
     *
     * 0  = nose
     * 11 = left shoulder
     * 12 = right shoulder
     * 13 = left elbow
     * 14 = right elbow
     * 15 = left wrist
     * 16 = right wrist
     * 19 = left index
     * 20 = right index
     * 23 = left hip
     * 24 = right hip
     * 25 = left knee
     * 26 = right knee
     * 27 = left ankle
     * 28 = right ankle
     * 31 = left foot index
     * 32 = right foot index
     *
     * @param {Array} joints
     * @returns {Object}
     */
    static getStandardAngles(joints) {
        if (!joints || joints.length < 33) {
            return {};
        }

        const angles = {
            // Elbows
            left_elbow: this.getAngle(joints[11], joints[13], joints[15]),

            right_elbow: this.getAngle(joints[12], joints[14], joints[16]),

            // Shoulders
            left_shoulder: this.getAngle(joints[23], joints[11], joints[13]),

            right_shoulder: this.getAngle(joints[24], joints[12], joints[14]),

            // Knees
            left_knee: this.getAngle(joints[23], joints[25], joints[27]),

            right_knee: this.getAngle(joints[24], joints[26], joints[28]),
        };

        // -----------------------------------------
        // Virtual body-center landmarks
        // -----------------------------------------

        const midShoulder = this.midpoint(joints[11], joints[12]);

        const midHip = this.midpoint(joints[23], joints[24]);

        // -----------------------------------------
        // Shoulder / Hip plane angles
        // -----------------------------------------

        angles.left_shoulder_plane = this.getAngle(
            midShoulder,
            joints[11],
            joints[13],
        );

        angles.right_shoulder_plane = this.getAngle(
            midShoulder,
            joints[12],
            joints[14],
        );

        angles.left_hip_plane = this.getAngle(midHip, joints[23], joints[25]);

        angles.right_hip_plane = this.getAngle(midHip, joints[24], joints[26]);

        // -----------------------------------------
        // Neck
        // -----------------------------------------

        angles.neck = this.getAngle(joints[11], midShoulder, joints[0]);

        // -----------------------------------------
        // Hips
        // -----------------------------------------

        angles.left_hip = this.getAngle(joints[11], joints[23], joints[25]);

        angles.right_hip = this.getAngle(joints[12], joints[24], joints[26]);

        // -----------------------------------------
        // Ankles
        // -----------------------------------------

        angles.left_ankle = this.getAngle(joints[25], joints[27], joints[31]);

        angles.right_ankle = this.getAngle(joints[26], joints[28], joints[32]);

        // -----------------------------------------
        // Wrists
        // -----------------------------------------

        angles.left_wrist = this.getAngle(joints[13], joints[15], joints[19]);

        angles.right_wrist = this.getAngle(joints[14], joints[16], joints[20]);

        return angles;
    }
}

export default PhysioGeometry;
