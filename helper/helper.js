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

export const validateEmail = (email) => {
  email = checkString(email, "Email").toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw "Email is invalid";
  }
  return email;
};

export function validatePassword(password) {
  const trimmed = checkString(password, "Password");
  if (trimmed.includes(" ")) throw "Password cannot contain spaces";
  if (trimmed.length < 6) throw "Password must be at least 6 characters";
  return trimmed;
}

