// ─── Regex Patterns ───────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\s]{2,50}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s._'-]{2,50}$/;
const STUDENT_ID_REGEX = /^\d{6,12}$/;
// Ghana phone: 05X/02X/03X with 7 more digits, or +233 variant
const PHONE_REGEX = /^(0[235]\d{8}|(\+233)[235]\d{8})$/;

const MIN_PASSWORD_LENGTH = 6;

// ─── Validators ───────────────────────────────────────────────────
// Each returns an error string or null if valid.

export function validateEmail(email) {
  if (!email) return "Email is required.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  return null;
}

export function validateName(name, label = "Name") {
  if (!name) return `${label} is required.`;
  if (!NAME_REGEX.test(name))
    return `${label} can only contain letters and spaces, and must be 2-50 characters long.`;
  return null;
}

export function validateUsername(username) {
  if (!username) return "Username is required.";
  if (!USERNAME_REGEX.test(username))
    return "Username must be 3-20 characters long and can only contain letters, numbers, and underscores.";
  return null;
}

export function validateDisplayName(displayName) {
  if (!displayName) return "Display name is required.";
  if (!DISPLAY_NAME_REGEX.test(displayName))
    return "Display name must be 2-50 characters and can only contain letters, numbers, spaces, and . _ ' -";
  return null;
}

export function validateStudentId(studentId) {
  if (!studentId) return "Student ID is required.";
  if (!STUDENT_ID_REGEX.test(studentId))
    return "Student ID must be 6-12 digits.";
  return null;
}

export function validatePhone(phone) {
  if (!phone) return "Contact number is required.";
  // Strip spaces before testing
  const cleaned = phone.replace(/\s/g, "");
  if (!PHONE_REGEX.test(cleaned))
    return "Enter a valid Ghanaian phone number (e.g. 0501234567 or +233501234567).";
  return null;
}

export function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  return null;
}

export function validateDateOfBirth(dateString) {
  if (!dateString) return "Date of birth is required.";
  const dob = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 15) return "You must be at least 15 years old.";
  return null;
}
