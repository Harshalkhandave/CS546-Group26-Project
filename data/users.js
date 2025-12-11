import { userCollection } from "../model/index.js";
import bcrypt from "bcrypt";
import { checkString, validateEmail, validatePassword, isValidId } from "../helper/helper.js";

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
    const existing = await userCollection.findOne({ lowerEmail });
    if (existing) throw "Email already exists";
    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = await userCollection.create({
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

    const user = await userCollection.findById(id);
    if (!user) throw "User not found";
    return user;
  },

  async login(email, password) {
    email = validateEmail(email);
    password = validatePassword(password);

    const lowerEmail = email.toLowerCase();
    const user = await userCollection.findOne({ lowerEmail });

    if (!user) throw "Email or password invalid";

    const match = await bcrypt.compare(password, user.hashedPwd);
    if (!match) throw "Email or password invalid";

    return {
      _id: user._id.toString(),
      lowerEmail: user.lowerEmail,
      role: user.role
    };
  },

  async updateProfile(userId, fname, lname, email) {
    userId = isValidId(userId);
    fname = checkString(fname, "First name");
    lname = checkString(lname, "Last name");
    email = validateEmail(email);

    const user = await userCollection.findById(userId);
    if (!user) throw "User not found";

    const newLowerEmail = email.toLowerCase();
    
    // Check if new email is different and already exists
    if (newLowerEmail !== user.lowerEmail) {
      const existing = await userCollection.findOne({ lowerEmail: newLowerEmail });
      if (existing) throw "Email already exists";
    }

    const updated = await userCollection.findByIdAndUpdate(
      userId,
      {
        fname,
        lname,
        lowerEmail: newLowerEmail,
        updatedAt: new Date()
      },
      { new: true }
    );

    return updated;
  }
};

export default exportedMethods;
