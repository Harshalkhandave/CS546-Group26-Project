import { users } from "../config/mongoCollections.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import {
    checkString,
    validateEmail,
    validatePassword,
    validateId
} from "../helper/helper.js";

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
        const userCollection = await users();
        const existing = await userCollection.findOne({ lowerEmail });
        if (existing) throw "Email already exists";

        const hash = await bcrypt.hash(password, saltRounds);

        const newUser = {
            _id: new ObjectId(),
            lowerEmail,
            hashedPwd: hash,
            role,
            comments: [],
            likedBoroughs: [],
            creationDate: new Date()
        };

        const insertInfo = await userCollection.insertOne(newUser);
        if (!insertInfo.insertedId) throw "Could not create user";

        return this.getUserById(insertInfo.insertedId.toString());
    },

    async getUserById(id) {
        id = validateId(id);
        const _id = new ObjectId(id);

        const userCollection = await users();
        const user = await userCollection.findOne({ _id });
        if (!user) throw "User not found";
        return user;
    },

    async login(email, password) {
        email = validateEmail(email);
        password = validatePassword(password);

        const lowerEmail = email.toLowerCase();
        const userCollection = await users();

        const user = await userCollection.findOne({ lowerEmail });
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
