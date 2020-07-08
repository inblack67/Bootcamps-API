const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');


// @desc get all reviews
// @route GET /api/v1/reviews
// @route GET /api/v1/:bootcampId/reviews
// @access public
exports.getReviews = asyncHandler(
  async (req,res,next) => {

    if(req.params.bootcampId)
    {
      const reviews = await Review.find({ bootcamp: req.params.bootcampId });
      res.status(200).json({ success: true, count: reviews.length, data: reviews });
    }
    else  // get all courses whatsoever
    {
      res.status(200).json(res.advancedQueries);
    }

  }
);


// @desc get single review
// @route GET /api/v1/reviews/:id
// @access public
exports.getReview = asyncHandler(
  async (req,res,next) => {

    const review = await Review.findById(req.params.id).populate({
      path: 'bootcamp',
      select: 'name description'
    });

    if(!review)
    {
      return next(new ErrorResponse(`No review with id ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: review });

  }

);


// @desc Add Review
// @route POST /api/v1/bootcamps/:bootcampId/reviews
// @access Private
exports.addReview = asyncHandler(
  async (req,res,next) => {

    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id     // i.e. current logged in user
    
    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if(!bootcamp)
    {
      return next(new ErrorResponse(`No bootcamp with id ${req.params.bootcampId}`, 404));
    }

    const review = await Review.create(req.body);
    // body would now have the user as well as the bootcamp

    res.status(201).json({ success: true, data: review });

  }

);

// @desc Update Review
// @route POST /api/v1/reviews/:id
// @access Private
exports.updateReview = asyncHandler(
  async (req,res,next) => {
    
    let review = await Review.findById(req.params.id);

    if(!review)
    {
      return next(new ErrorResponse(`No review with id ${req.params.id}`, 404));
    }

    // review does not belongs to the logged in user and the user is not even the admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin')
    {
      return next(new ErrorResponse(`Not Authorized to update the review`, 400));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: review });

  }
);



// @desc Delete Review
// @route DELETE /api/v1/reviews/:id
// @access Private
exports.deleteReview = asyncHandler(
  async (req,res,next) => {
    
    let review = await Review.findById(req.params.id);

    if(!review)
    {
      return next(new ErrorResponse(`No review with id ${req.params.id}`, 404));
    }

    // review does not belongs to the logged in user and the user is not even the admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin')
    {
      return next(new ErrorResponse(`Not Authorized`, 404));
    }

    await Review.findByIdAndRemove(req.params.id);

    res.status(200).json({ success: true, msg: 'deleted' });

  }

);




