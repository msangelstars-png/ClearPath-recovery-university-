const express = require('express');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/v1/courses
// @desc    Get all published courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate('instructor', 'name email');
    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/v1/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/v1/courses
// @desc    Create new course (Instructor/Admin only)
// @access  Private/Instructor
router.post('/', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, category, level, duration, modules } = req.body;
    const course = new Course({
      title,
      description,
      category,
      level,
      duration,
      modules,
      instructor: req.user.id,
    });
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/v1/courses/:id
// @desc    Update course (Instructor/Admin only)
// @access  Private/Instructor
router.put('/:id', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/v1/courses/:id
// @desc    Delete course (Instructor/Admin only)
// @access  Private/Instructor
router.delete('/:id', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
