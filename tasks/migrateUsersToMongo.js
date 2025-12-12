import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Users from '../model/user.js';
import connectDB from '../config/mongoConnection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrateUsers() {
  try {
    const usersFile = path.join(__dirname, '../data/users.json');
    if (!fs.existsSync(usersFile)) {
      console.log('No file-based users.json found, skipping migration.');
      return;
    }

    const raw = fs.readFileSync(usersFile, 'utf8');
    let fileUsers;
    try {
      fileUsers = JSON.parse(raw);
    } catch (e) {
      console.warn('Could not parse users.json, skipping migration.', e.message);
      return;
    }

    if (!Array.isArray(fileUsers) || fileUsers.length === 0) {
      console.log('No users to migrate.');
      return;
    }

    console.log(`Found ${fileUsers.length} file-based users; migrating to Mongo if not present.`);

    for (const fu of fileUsers) {
      try {
        const emailRaw = (fu.email || '').trim();
        const lowerEmail = emailRaw.toLowerCase();
        if (!lowerEmail) continue;

        const existing = await Users.findOne({ lowerEmail });
        if (existing) {
          // already present
          continue;
        }

        // file user may have `password` field as hashed password
        const hashedPwd = fu.password || fu.hashedPwd || '';

        await Users.create({ lowerEmail, hashedPwd, fname: fu.fname || '', lname: fu.lname || '', role: 'user' });
        console.log(`Migrated user: ${lowerEmail}`);
      } catch (e) {
        console.warn('Failed migrating one user:', e.message);
      }
    }

    console.log('User migration completed.');
  } catch (e) {
    console.error('User migration failed:', e.message);
  }
}

export default migrateUsers;
