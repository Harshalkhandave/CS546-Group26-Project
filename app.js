import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import indexRoutes from './routes/index.js';
import borroughRoutes from './routes/boroughs.js';
import waterSampleRoutes from './routes/waterSamples.js';
import commentRoutes from './routes/comments.js';
import connectDB, { disconnectDB } from './config/mongoConnection.js'

await connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));

// handlebars setup
app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main'
  })
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// routes
app.use('/', indexRoutes);
app.use('/boroughs', borroughRoutes);
app.use('/waterSamples', waterSampleRoutes);
app.use('/comments', commentRoutes);

// middleware
app.use
// start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await disconnectDB();
  server.close(() => process.exit(0));
});