const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const mapquest = require('mapquest');
const errorHandler = require('./middleware/error');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const path = require('path');
const sanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const connectDB = require('./config/db');

// load routes
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

// load env vars
dotenv.config({path: './config/config.env'});

connectDB();

const app = express();

// body parser middleware
app.use(express.json());

// sanitize data
app.use(sanitize());

// set security headers
app.use(helmet());

// prevent XSS attacks
app.use(xss());

// rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutes
  max: 100
});

app.use(limiter);

// prevent http param pollution
app.use(hpp());

// enable CORS
app.use(cors());

// cookie parser middleware
app.use(cookieParser());

// fileupload middleware
app.use(fileUpload());

// dev logger
if(process.env.NODE_ENV === 'development')
{
  app.use(morgan('dev'));
}

// use routes
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// static folder for uploads
app.use(express.static(path.join(__dirname, 'public')));

// error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log
  (`Server running in ${process.env.NODE_ENV} mode and on port ${PORT}`.blue.bold);
});

//  handling rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1));
});