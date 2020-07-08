const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');


// protect routes
exports.protect = asyncHandler(async (req, res, next) => {

  let token;

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  {
    token = req.headers.authorization.split(' ')[1];
  }

  // if cookie has the token, if not the header
  else if(req.cookies.token)
  {
    token = req.cookies.token;
  }

  if(!token)
  {
    return next(new ErrorResponse('Not Authorized', 401));
  }

  try {
    
    // verify token - extract payload 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();

  } catch (err) {
    return next(new ErrorResponse('Not Authorized', 401));
  }


});


exports.authorize = (...roles) => asyncHandler(async (req, res, next) => {

  try {

    if(!roles.includes(req.user.role))
    {
      return next(new ErrorResponse(`User role = ${req.user.role}, is not authorized for this route`, 403));
    }

    next();

  } catch (err) {
    return next(new ErrorResponse('Not Authorized', 403));
  }


});