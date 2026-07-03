const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/auth');

// Retrieve all notifications for authenticated user
router.get('/', authenticate, notificationController.getNotifications);

// Retrieve unread notifications count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Mark all notifications as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
