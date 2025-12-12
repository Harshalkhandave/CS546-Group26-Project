import homeRoutes from './home.js';
import usersRoutes from './users.js';
import boroughsRoutes from './boroughs.js';
import apiRoutes from './api.js';
import authRoutes from './auth.js';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/boroughs', boroughsRoutes);
  app.use('/', homeRoutes);

  app.use('/api', apiRoutes);
  app.use((req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;