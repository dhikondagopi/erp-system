const transferService = require('../services/transferService');
const { sendSuccess } = require('../utils/response');

class TransferController {
  getTransferById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const transfer = await transferService.getTransferById(id);
      return sendSuccess(res, 'Transfer request details loaded successfully.', transfer);
    } catch (error) {
      return next(error);
    }
  };

  getAllTransfers = async (req, res, next) => {
    try {
      const result = await transferService.getAllTransfers(req.query);
      return sendSuccess(res, 'Transfer requests history loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  createTransfer = async (req, res, next) => {
    try {
      const newTransfer = await transferService.createTransfer(req.body, req.user.id);
      return sendSuccess(res, 'Transfer request submitted successfully.', newTransfer, 201);
    } catch (error) {
      return next(error);
    }
  };

  approveTransfer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const approved = await transferService.approveTransfer(id, req.user.id);
      return sendSuccess(res, 'Transfer request approved and inventory moved successfully.', approved);
    } catch (error) {
      return next(error);
    }
  };

  rejectTransfer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const rejected = await transferService.rejectTransfer(id, req.user.id);
      return sendSuccess(res, 'Transfer request rejected successfully.', rejected);
    } catch (error) {
      return next(error);
    }
  };

  cancelTransfer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const cancelled = await transferService.cancelTransfer(id, req.user.id);
      return sendSuccess(res, 'Transfer request cancelled successfully.', cancelled);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new TransferController();
