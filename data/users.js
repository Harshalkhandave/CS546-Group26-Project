import Users from "../model/user.js"; // Mongoose model
import bcrypt from "bcrypt";
import { checkString, validateEmail, validatePassword } from "../helper/helper.js";

const saltRounds = 10;

const exportedMethods = {
  async createUser(email, password, role = "user") {
    email = validateEmail(email);
    password = validatePassword(password);
    role = checkString(role, "Role").toLowerCase();
    if (role !== "user" && role !== "admin") {
      throw "Invalid role";
    }
    const lowerEmail = email.toLowerCase();
    const existing = await Users.findOne({ lowerEmail });
    if (existing) throw "Email already exists";
    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = await Users.create({
      lowerEmail,
      hashedPwd: hash,
      role,
      comments: [],
      likedBoroughs: [],
      creationDate: new Date()
    });
    return newUser;
  },

  async getUserById(id) {
    id = validateId(id);

    const user = await Users.findById(id);
    if (!user) throw "User not found";
    return user;
  },

  async login(email, password) {
    email = validateEmail(email);
    password = validatePassword(password);

    const lowerEmail = email.toLowerCase();
    const user = await Users.findOne({ lowerEmail });

    if (!user) throw "Email or password invalid";

    const match = await bcrypt.compare(password, user.hashedPwd);
    if (!match) throw "Email or password invalid";

    return {
      _id: user._id.toString(),
      lowerEmail: user.lowerEmail,
      role: user.role
    };
  }
};

export default exportedMethods;
