const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
process.on('uncaughtException', err => {
  console.log("UNCAUGHT EXCEPTION");
  server.close(() => {
    process.exit(1);
  })
})
// console.log(DB);
mongoose.connect(DB).then(() => {
  console.log('DB connection succesfull');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  // eslint-disable-next-line prettier/prettier
  console.log(`listening on port ${port}....`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log("UNHANDLER REJECTION SHUTTING EVERYING DOWN");
  server.close(() => {
    process.exit(1);
  })
});



