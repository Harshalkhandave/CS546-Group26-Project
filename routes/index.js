import homeRoutes from './home.js';
import usersRoutes from './users.js';
import boroughsRoutes from './boroughs.js';
import apiRoutes from './api.js';

const constructorMethod = (app) => {
  app.use('/', homeRoutes);
  app.use('/user', usersRoutes);
  app.use('/boroughs', boroughsRoutes);
  app.use('/api', apiRoutes);
  app.use('{*splat}', (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;