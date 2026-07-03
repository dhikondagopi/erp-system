const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/response');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const data = await notificationService.getNotifications(req.user);
      return sendSuccess(res, 'Notifications retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user);
      return sendSuccess(res, 'Unread notification count retrieved successfully', { count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const data = await notificationService.markAsRead(id, req.user);
      if (!data) {
        const error = new Error('Notification not found or access denied');
        error.statusCode = 404;
        throw error;
      }
      return sendSuccess(res, 'Notification marked as read successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const data = await notificationService.markAllAsRead(req.user);
      return sendSuccess(res, 'All notifications marked as read successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
