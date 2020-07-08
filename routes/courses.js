const express = require('express');
const {

  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse

} = require('../controllers/courses');

const Course = require('../models/Course');

// middlewares
const advancedQueries = require('../middleware/advancedQueries');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/').get(advancedQueries(Course, {
  path: 'bootcamp',
  select: 'name description'
}), getCourses).post(protect, authorize('publisher', 'admin'), addCourse);

router.route('/:id').get(getCourse).put(protect, authorize('publisher', 'admin'), updateCourse).delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;