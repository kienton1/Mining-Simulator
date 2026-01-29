/**
 * Pet Following System Constants
 *
 * Constants for pet following behavior, formation, movement, and stuck detection.
 */

// === Formation ===
export const PET_FORMATION_BEHIND_DISTANCE = 1.2; // Units behind player (very close)
export const PET_FORMATION_SIDE_OFFSET = 1.0;     // Units between pets horizontally
export const PET_FORMATION_ROW_SPACING = 1.2;     // Distance between rows
export const PET_FOLLOW_DISTANCE_STOP = 0.8;      // Stop moving when this close (hysteresis)
export const PET_FOLLOW_DISTANCE_START = 1.5;     // Start moving when further than this (hysteresis)
export const PET_TELEPORT_DISTANCE = 25;         // Teleport if further than this
export const PET_EXTREME_DISTANCE_THRESHOLD = 50; // Instant teleport threshold

// === Movement ===
export const PET_BASE_SPEED = 8;                 // Base pet movement speed (matches player run)
export const PET_MAX_SPEED = 10;                 // Maximum pet speed

// === Step-Up (Obstacle Climbing) ===
export const PET_STEP_HEIGHT = 1.15;             // Max height pet can step up (just over 1 block)
export const PET_STEP_PROBE_DISTANCE = 0.8;      // How far ahead to check for obstacles
export const PET_STEP_UP_VELOCITY = 8;           // Upward velocity when stepping up

// === Stuck Detection ===
export const PET_STUCK_CHECK_INTERVAL_MS = 2000; // How often to check if stuck
export const PET_STUCK_DISTANCE_THRESHOLD = 0.5; // If moved less than this, considered stuck
export const PET_STUCK_MAX_DURATION_MS = 6000;   // Max time stuck before teleport

// === Visibility Check ===
export const PET_VISIBILITY_CHECK_INTERVAL_MS = 1000; // How often to check line of sight
export const PET_VISIBILITY_MIN_DISTANCE = 5;         // Only check visibility if further than this
export const PET_VISIBILITY_FAIL_MAX_COUNT = 3;       // How many consecutive fails before teleporting

// === Pet Scaling ===
export const TARGET_PET_HEIGHT = 0.6;            // Desired uniform height for all pets
export const PET_DEFAULT_SCALE = 0.35;           // Default model scale if height unknown

// === Bounce Animation ===
export const PET_BOUNCE_AMPLITUDE = 0.4;         // Height of bounce in units (stronger bounce)
export const PET_GRAVITY_SCALE = 0.92;           // Reduced gravity multiplier (only 8% lighter, subtle float)
export const PET_BOUNCE_COOLDOWN_MS = 600;       // Minimum time between bounces (0.6 seconds)
