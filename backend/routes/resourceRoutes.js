const express = require('express');
const Resource = require('../models/Resource');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/v1/resources
// @desc    Get all approved resources
// @access  Public
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find({ isApproved: true });
    res.status(200).json({ success: true, count: resources.length, resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/v1/resources/:id
// @desc    Get resource by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(200).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/v1/resources
// @desc    Create new resource (Instructor/Admin only)
// @access  Private/Instructor
router.post('/', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, type, category, url, author, courseId, tags } = req.body;
    const resource = new Resource({
      title,
      description,
      type,
      category,
      url,
      author,
      courseId,
      tags,
      isApproved: req.user.role === 'admin',
    });
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/v1/resources/:id
// @desc    Update resource
// @access  Private/Admin
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/v1/resources/:id
// @desc    Delete resource
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
