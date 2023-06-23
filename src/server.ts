import { app } from './app';
import { AppDataSource, initDBConnection } from './database/dataSource';

// let PORT_GRPC = process.env.PORT_GRPC || '4080';
let PORT_HTTP = process.env.PORT_HTTP || '8080';

// connect to database
initDBConnection().then(() => {
  // run migrations when connection is succesfu
  AppDataSource.runMigrations();
});
// start server
app.listen(PORT_HTTP, () => {
  console.log(`HTTP User server listening on port ${PORT_HTTP}...`);
});

// need to fix tsconfigs build targets to exclude test directory
