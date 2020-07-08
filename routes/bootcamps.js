const express = require('express');
const {

  getBootcamps, 
  getBootcamp,
  createBootcamp, 
  updateBootcamp,
  deleteBootcamp ,
  getBootcampsWithinRadius,
  bootcampPhotoUpload

} = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');

// middlewares
const advancedQueries = require('../middleware/advancedQueries');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

// re-route to course router
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewRouter);


router.route('/radius/:zipcode/:distance')
.get(getBootcampsWithinRadius);


router.route('/')
.get(advancedQueries(Bootcamp, 'courses'), getBootcamps)
.post(protect, authorize('publisher', 'admin'), createBootcamp);

router.route('/:id')
.get(getBootcamp)
.put(protect, authorize('publisher', 'admin'), updateBootcamp)
.delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)


// cmd + d = highlight all the follwing, but one by one.


module.exports = router;