import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import configRoutes from './routes/index.js';
import connectDB, { disconnectDB } from './config/mongoConnection.js';
import { logMdw } from './middleware.js';

dotenv.config();

await connectDB();
await import('./config/passport.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

try {
  const { default: migrateUsers } = await import('./tasks/migrateUsersToMongo.js');
  await migrateUsers();
} catch (e) {
  console.warn('User migration step skipped or failed:', e && e.message ? e.message : e);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'AuthCookie',
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(logMdw);

app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  res.locals.isAuthenticated = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;

  next();
});

app.use('/public', express.static(path.join(__dirname, 'public')));

app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main',
    helpers: {
      eq: (a, b) => a == b,

      // Verify admin or user
      or: (v1, v2) => Boolean(v1 || v2),

      toFixed3: (num) => Number(num).toFixed(3),
      json: (context) => JSON.stringify(context),
      array: (...args) => {
        args.pop();
        return args;
      }
    }
  })
);

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

configRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await disconnectDB();
  process.exit(0);
});
