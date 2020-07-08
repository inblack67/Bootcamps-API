const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');


// @desc get all courses
// @route GET /api/v1/courses
// @route GET /api/v1/:bootcampId/courses
// @access public
exports.getCourses = asyncHandler(
  async (req,res,next) => {

    if(req.params.bootcampId)
    {
      const courses = await Course.find({ bootcamp: req.params.bootcampId });
      res.status(200).json({ success: true, count: courses.length, data: courses });
    }
    else  // get all courses whatsoever
    {
      res.status(200).json(res.advancedQueries);
    }

  }
);


// @desc get single course
// @route GET /api/v1/courses/:id
// @access public
exports.getCourse = asyncHandler(
  async (req,res,next) => {

    const course = await Course.findById(req.params.id).populate({
      path: 'bootcamp',
      select: 'name desciption'
    });

    if(!course)
    {
      return next(new ErrorResponse(`Course with id ${req.params.id} not found`, 404)); 
    }

    return res.status(200).json({
      success: true,
      data: course
    });

  }
);


// @desc add a course
// @route POST /api/v1/bootcamps/:bootcampId/courses
// @access private
exports.addCourse = asyncHandler(

  async (req,res,next) => {

    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if(!bootcamp)
    {
      return next(new ErrorResponse(`Bootcamp with id ${req.params.bootcampId} not found`, 404));
    }

    // check the ownership of the course
    if( bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin' )
    {
      return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`, 401));
    }

    const course = await Course.create(req.body);


    return res.status(200).json({
      success: true,
      data: course
    });

  }
);


// @desc update a course
// @route PUT /api/v1/courses
// @access private
exports.updateCourse = asyncHandler(

  async (req,res,next) => {

    let course = await Course.findById(req.params.id);

    if(!course)
    {
      return next(new ErrorResponse(`Course with id ${req.params.id} not found`, 404));
    }

    // check the ownership of the course
    if( course.user.toString() !== req.user.id && req.user.role !== 'admin' )
    {
      return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to update the course  ${course._id}`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      data: course
    });

  }
);


// @desc delete a course
// @route DELETE /api/v1/courses
// @access private
exports.deleteCourse = asyncHandler(

  async (req,res,next) => {

    const course = await Course.findById(req.params.id);

    if(!course)
    {
      return next(new ErrorResponse(`Course with id ${req.params.id} not found`, 404));
    }

    // check the ownership of the course
    if( course.user.toString() !== req.user.id && req.user.role !== 'admin' )
    {
      return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to delete the course  ${course._id}`, 401));
    }

    await course.deleteOne();

    return res.status(200).json({
      success: true,
      data: 'deleted'
    });

  }
);