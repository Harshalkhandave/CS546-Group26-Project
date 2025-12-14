import homeRoutes from './home.js';
import usersRoutes from './users.js';
import boroughsRoutes from './boroughs.js';
import apiRoutes from './api.js';
import waterSamplesRoutes from './waterSamples.js';
import authRoutes from './auth.js';
import voteRoutes from "./votes.js";
import commentsRoutes from "./comments.js";

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/boroughs', boroughsRoutes);
  app.use('/waterSamples', waterSamplesRoutes);
  app.use('/comments', commentsRoutes);
  app.use('/', homeRoutes);
  app.use("/votes", voteRoutes);
  app.use('/api', apiRoutes);
  
  app.use((req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;