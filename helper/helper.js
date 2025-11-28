import { ObjectId } from "mongodb";

export const checkString = (str, varName) => {
  if (!str) throw `${varName} is required`;
  if (typeof str !== "string") throw `${varName} must be a string`;
  str = str.trim();
  if (str.length === 0) throw `${varName} cannot be empty or just spaces`;
  return str;
};

export const isValidId = (id) => {
  checkString(id, "id");
  id = id.trim();
  if (!ObjectId.isValid(id)) throw `Invalid ObjectId format`;
  return id;
};

export function validateEmail(email) {
  let trimmed = checkString(email, "Email").toLowerCase();
  if (trimmed.includes(" ")) throw "Email is invalid";

  const firstAtIndex = trimmed.indexOf("@");
  const lastAtIndex = trimmed.lastIndexOf("@");
  if (firstAtIndex <= 0 || firstAtIndex !== lastAtIndex) throw "Email is invalid";
  const dotIndex = trimmed.indexOf(".", firstAtIndex + 2);
  if (dotIndex === -1 || dotIndex === trimmed.length - 1) {
    throw "Email is invalid";
  }

  if (trimmed.includes("..")) throw "Email is invalid";
  if (trimmed.startsWith(".")) throw "Email is invalid";
  if (trimmed[firstAtIndex - 1] === ".") throw "Email is invalid";

  return trimmed;
}

export function validatePassword(password) {
  const trimmed = checkString(password, "Password");
  if (trimmed.length < 6) throw "Password must be at least 6 characters";
  return trimmed;
}

export function validateDisplayName(displayName, fallback) {
  if (displayName === undefined || displayName === null) {
    if (!fallback) throw "Display name missing";
    return checkString(fallback, "Display name");
  }
  if (typeof displayName !== "string") {
    throw "Display name must be a string";
  }
  
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    if (!fallback) throw "Display name cannot be empty";
    return checkString(fallback, "Display name");
  }
  if (trimmed.length > 40) throw "Display name too long";
  return trimmed;
}

export function validateId(id) {
  return isValidId(id);
}