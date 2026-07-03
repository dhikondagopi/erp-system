const reportsService = require('../services/reportsService');
const { sendSuccess, sendError } = require('../utils/response');

class ReportsController {
  /**
   * Main report handler for querying and downloading report formats.
   */
  getReport = async (req, res, next) => {
    try {
      const { type } = req.params;
      const { format = 'json', startDate, endDate, status } = req.query;

      const validTypes = ['sales', 'purchases', 'inventory', 'manufacturing', 'customers', 'vendors'];
      if (!validTypes.includes(type)) {
        return sendError(res, `Invalid report type: '${type}'. Must be one of: ${validTypes.join(', ')}`, 400);
      }

      const validFormats = ['json', 'csv', 'excel', 'pdf'];
      if (!validFormats.includes(format)) {
        return sendError(res, `Invalid report format: '${format}'. Must be one of: ${validFormats.join(', ')}`, 400);
      }

      // Fetch aggregated data
      const data = await reportsService.getReportData(type, { startDate, endDate, status });

      if (format === 'json') {
        return sendSuccess(res, `${type.toUpperCase()} report data retrieved successfully.`, {
          reportType: type,
          count: data.length,
          generatedAt: new Date(),
          rows: data
        });
      }

      // Prepare file names and attachments
      const cleanDate = new Date().toISOString().split('T')[0];
      const filename = `${type}_report_${cleanDate}`;

      if (format === 'csv') {
        const csvContent = await reportsService.generateCSV(type, data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvContent);
      }

      if (format === 'excel') {
        const htmlContent = await reportsService.generateExcelHTML(type, data);
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
        return res.send(htmlContent);
      }

      if (format === 'pdf') {
        const pdfStream = await reportsService.generatePDFStream(type, data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return pdfStream.pipe(res);
      }

    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ReportsController();
