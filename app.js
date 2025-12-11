import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import configRoutes from './routes/index.js';
import connectDB, { disconnectDB } from './config/mongoConnection.js'
import { logMdw } from './middleware.js';

dotenv.config();

await connectDB();
await import('./config/passport.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// request parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// sessions (required for Passport)
app.use(session({
  name: 'AuthCookie',
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// logging middleware
app.use(logMdw);

// expose session user to templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  next();
});

app.use('/public', express.static(path.join(__dirname, 'public')));

// handlebars setup
app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main',
    helpers: {
      toFixed3: (num) => Number(num).toFixed(3),
      json: (context) => JSON.stringify(context),
      array: (...args) => {
        args.pop();               // remove Handlebars options object
        return args;
      }
  }})
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// routes
configRoutes(app);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await disconnectDB();
  process.exit(0);
});
