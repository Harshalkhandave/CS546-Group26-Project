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