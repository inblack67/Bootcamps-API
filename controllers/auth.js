const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendMail  = require('../utils/sendMail');
require('colors')

// desc Register a user
// @route POST /api/v1/auth/register
// @access public
exports.register = asyncHandler(async (req,res, next) => {

  const { name, email, password, role } = req.body;

  const user = await User.create({ name, email, password, role });

  sendTokenCookie(user, 200, res);

});


// desc Login User
// @route POST /api/v1/auth/login
// @access public
exports.login = asyncHandler(async (req,res, next) => {

  const { email, password } = req.body;

  if(!email || !password)
  {
    return next(new ErrorResponse('Provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');   
  // since passwd is excluded in the User model

  if(!user)
  {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  const isMatch = await user.matchPassword(password);

  if(!isMatch)
  {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  // token
  sendTokenCookie(user, 200, res);

});


// desc Log User Out
// @route GET /api/v1/auth/logout
// @access Private
exports.logout = asyncHandler(async (req, res, next) => {

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })

  res.status(200).json({ success: true, msg: 'Logged Out' })

});



// desc get loggedin User
// @route GET /api/v1/auth/me
// @access private
exports.getMe = asyncHandler(async (req,res, next) => {

  const user = await User.findById(req.user); // auth user middleware

  if(!user)
  {
    return next(new ErrorResponse('Not Authorized', 401));
  }

  res.status(200).json({ success: true, data: user })

});

// desc Update User
// @route PUT /api/v1/auth/updatedetails
// @access private
exports.updateDetails = asyncHandler(async (req,res, next) => {

  // update name and email
  const fields = { name: req.body.name, email: req.body.email }
  const user = await User.findByIdAndUpdate(req.user.id, fields, {
    new: true,
    runValidators: true
  });

  if(!user)
  {
    return next(new ErrorResponse('Server Error', 500));
  }

  res.status(200).json({ success: true, data: user })

});


// desc Update Password
// @route PUT /api/v1/auth/updatepassword
// @access private
exports.updatePassword = asyncHandler(async (req,res, next) => {

  const user = await User.findById(req.user).select('+password');

  const isMatch = await user.matchPassword(req.body.currentPassword)

  if(!isMatch)
  {
    return next(new ErrorResponse('Password Incorrect', 401));
  }

  user.password = req.body.newPassword
  await user.save();

  res.status(200).json({ success: true, data: user })

});


// desc forgot password
// @route POST /api/v1/auth/forgotpassword
// @access public
exports.forgotPassword = asyncHandler(async (req,res, next) => {

  const user = await User.findOne({ email: req.body.email }); 

  if(!user)
  {
    return next(new ErrorResponse('Invalid Credentials', 404));
  }

  // GET reset token
  const resetToken = user.getResetPasswordToken();

  console.log(`forgot follows`.red.bold);
  console.log(resetToken);

  await user.save({ validateBeforeSave: false });

  // rest url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `This email is sent with respect to the request made by you to reset your password. To do so, you must make a PUT request to ${resetUrl} within the span of 10 minutes`;

  try {

    await sendMail({
      email: user.email,
      subject: 'Reset Password Token',
      message
    });

    res.status(200).json({ success: true, msg: 'Email sent' })

  } catch (err) {

    console.log(err);

    // what's their use now if the mail was not send?
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    return next(new ErrorResponse('Email could not be sent', 500));
  }

});

// desc Reset Password
// @route PUT /api/v1/auth/resetpassword/:resetToken
// @access Public
exports.resetPassword = asyncHandler(async (req,res, next) => {

  // get hashed token from url
  const resetPasswordToken  = req.params.resetToken;

  // crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  }); 

  if(!user)
  {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenCookie(user, 200, res);

});


// desc Send Reset Token
// @route POST /api/v1/auth/resetToken
// @access Public
exports.sendResetToken = asyncHandler(
  async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })

    if(!user){
      return next(new ErrorResponse('Invalid Credentials', 400));
    }

    if(!user.resetPasswordToken){
      return next(new ErrorResponse('Token either expired, or you did not generate it at all', 400));
    }

    console.log(`reset follows`.red.bold);
    console.log(user.resetPasswordToken);

    res.status(200).json({ success: true, resetToken: user.resetPasswordToken })
  }
)


// cookies
const sendTokenCookie = (user, statusCode, res) => {

  const token = user.getSignedJwtToken();

  const options = {

    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,   // only accessible throught client side script
  }

  if(process.env.NODE_ENV === 'production')
  {
    options.secure = true;    // secure flag on our cookie
  }

  res.status(statusCode).cookie('token', token, options).json({ success: true, token })

}