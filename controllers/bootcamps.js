const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder'); 
const path = require('path');


// @desc get all bootcamps
// @route GET /api/v1/bootcamps
// @access public
exports.getBootcamps = asyncHandler(
  async (req,res,next) => {

    res.status(200).json(res.advancedQueries);
}
);

// @desc get one bootcamps
// @route GET /api/v1/bootcamps/:id
// @access public
exports.getBootcamp = asyncHandler(
  async (req,res,next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp)
    {
      // id is formatted but does not exists in the db
      return next(new ErrorResponse(`Bootcamp with id ${req.params.id} not found`, 404));
    }

    res.status(200).json({
      success: true,
      data: bootcamp
    });
}
);

// @desc create new bootcamp
// @route POST /api/v1/bootcamps
// @access private (have to be logged in)
exports.createBootcamp = asyncHandler(

  async (req,res,next) => {

    // from auth middleware we have the logged in user
    req.body.user = req.user.id;

    // publisher can add only one bootcamp, admin - as many
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

    if(publishedBootcamp && req.user.role === 'publisher')
    {
      return next(new ErrorResponse(`User with id ${req.user.id} has published one bootcamp already`, 400));
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
      success: true,
      data: bootcamp
    });
}
);

// @desc update bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access private
exports.updateBootcamp = asyncHandler(
  async (req,res,next) => {


    let bootcamp = await Bootcamp.findById(req.params.id);
  
    if(!bootcamp)
    {
      return next(new ErrorResponse(`Bootcamp with id ${req.params.id} not found`, 404));
    }

    // check the ownership of the bootcamp
    if( bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin' )
    {
      return next(new ErrorResponse(`User with id ${req.params.id} is not authorized to update this bootcamp`, 404));
    }


    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
  
    res.status(200).json({
      success: true,
      data: bootcamp
    });
  }
);

// @desc delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access private
exports.deleteBootcamp = asyncHandler(
  async (req,res,next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp)
    {
      return next(new ErrorResponse(`Bootcamp with id ${req.params.id} not found`, 404));
    }

     // check the ownership of the bootcamp
     if( bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin' )
     {
       return next(new ErrorResponse(`User with id ${req.params.id} is not authorized to delete this bootcamp`, 404));
     }

    bootcamp.remove();

    res.status(200).json({
      success: true,
      data: {msg: "deleted"}
    });
}

);

// @desc get bootcamps within a radius
// @route GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access private

exports.getBootcampsWithinRadius = asyncHandler(

  async (req,res,next) => {
    const { zipcode, distance } = req.params;

    // get latitude/longitude
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const long = loc[0].longitude;

    // cal radius 
    // div distance by radius (3963 miles) of earth
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [ [ long, lat ], radius ] } }
    });

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps
    });
  }
);



// @desc Upload photo for bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access private
exports.bootcampPhotoUpload = asyncHandler(
  async (req,res,next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp)
    {
      return next(new ErrorResponse(`Bootcamp with id ${req.params.id} not found`, 404));
    }

     // check the ownership of the bootcamp
     if( bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin' )
     {
       return next(new ErrorResponse(`User with id ${req.params.id} is not authorized to update this bootcamp`, 404));
     }


    if(!req.files)
    {
      return next(new ErrorResponse(`No file found`, 404));
    }

    const file = req.files.file;

    if(!file.mimetype.startsWith('image'))
    {
      return next(new ErrorResponse(`Only an image can be uploaded`, 404));
    }

    if(file.size > process.env.MAX_PHOTO_UPLOAD_SIZE)
    {
      return next(new ErrorResponse(`Image size cannot exceed ${process.env.MAX_PHOTO_UPLOAD_SIZE} Bytes`, 404));
    }

    // custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.PHOTO_UPLOAD_PATH}/${file.name}`, async (err) => {
      if(err)
      {
        console.log(err);
        return next(new ErrorResponse(`Problem occured while uploading`, 500));
      }

      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
      res.status(201).json({ success: true, data: file.name });

    });
}

);