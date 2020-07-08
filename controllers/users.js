const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// all crud fnality but for admin only, ofc.

// @desc get all users
// @route GET /api/v1/users
// @access Private/Admin
exports.getUsers = asyncHandler(
  async (req,res,next) => {
    res.status(200).json(res.advancedQueries);
}
);

// @desc get single users
// @route GET /api/v1/users/:id
// @access Private/Admin
exports.getUser = asyncHandler(
  async (req,res,next) => {

    const user = await User.findById(req.params.id);

    res.status(200).json({ success: true, data: user });
}
);


// @desc create  user
// @route POST /api/v1/users
// @access Private/Admin
exports.createUser = asyncHandler(
  async (req,res,next) => {

    const user = await User.create(req.body);

    res.status(201).json({ success: true, data: user });
}
);


// @desc update user
// @route PUT /api/v1/users/user/:id
// @access Private/Admin
exports.updateUser = asyncHandler(
  async (req,res,next) => {

    const newData = {};

    if(req.body.name !== ''){
      newData.name = req.body.name
    }

    if(req.body.email !== ''){
      newData.email = req.body.email
    }

    if(req.body.role !== ''){
      newData.role = req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
}
);


// @desc delete user
// @route DELETE /api/v1/users/:id
// @access Private/Admin
exports.deleteUser = asyncHandler(
  async (req,res,next) => {

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, msg: 'User Deleted' });
}
);
