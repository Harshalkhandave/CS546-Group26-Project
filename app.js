import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import indexRoutes from './routes/index.js';
import connectDB from './config/mongoConnection.js'

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

// start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
