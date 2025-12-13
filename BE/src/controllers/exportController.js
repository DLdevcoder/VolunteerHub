import Export from "../models/Export.js";
import ExportUtils from "../utils/exportUtils.js";

const exportController = {
  // Export users
  async exportUsers(req, res) {
    try {
      const { format = "json", ...filters } = req.query;
      const validFormats = ["json", "csv"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format không hợp lệ. Chọn: json, csv",
        });
      }

      const users = await Export.exportUsers(filters);
      const filename = ExportUtils.generateFilename("users", format);

      if (format === "csv") {
        const fields = ExportUtils.getFieldsForType("users");
        const csv = ExportUtils.convertToCSV(users, fields, "users"); // Thêm dataType

        ExportUtils.setExportHeaders(res, filename, "csv");
        return res.send(csv);
      } else {
        ExportUtils.setExportHeaders(res, filename, "json");
        return res.json({
          success: true,
          data: users,
          metadata: {
            total_records: users.length,
            exported_at: new Date().toISOString(),
            filters: filters,
          },
        });
      }
    } catch (error) {
      console.error("Export users error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export users",
      });
    }
  },

  // Export events
  async exportEvents(req, res) {
    try {
      const { format = "json", ...filters } = req.query;
      const validFormats = ["json", "csv"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format không hợp lệ. Chọn: json, csv",
        });
      }

      const events = await Export.exportEvents(filters);
      const filename = ExportUtils.generateFilename("events", format);

      if (format === "csv") {
        const fields = ExportUtils.getFieldsForType("events");
        const csv = ExportUtils.convertToCSV(events, fields, "events"); // Thêm dataType

        ExportUtils.setExportHeaders(res, filename, "csv");
        return res.send(csv);
      } else {
        ExportUtils.setExportHeaders(res, filename, "json");
        return res.json({
          success: true,
          data: events,
          metadata: {
            total_records: events.length,
            exported_at: new Date().toISOString(),
            filters: filters,
          },
        });
      }
    } catch (error) {
      console.error("Export events error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export events",
      });
    }
  },

  // Export registrations
  async exportRegistrations(req, res) {
    try {
      const { format = "json", ...filters } = req.query;
      const validFormats = ["json", "csv"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format không hợp lệ. Chọn: json, csv",
        });
      }

      const registrations = await Export.exportRegistrations(filters);
      const filename = ExportUtils.generateFilename("registrations", format);

      if (format === "csv") {
        const fields = ExportUtils.getFieldsForType("registrations");
        const csv = ExportUtils.convertToCSV(registrations, fields);

        ExportUtils.setExportHeaders(res, filename, "csv");
        return res.send(csv);
      } else {
        ExportUtils.setExportHeaders(res, filename, "json");
        return res.json({
          success: true,
          data: registrations,
          metadata: {
            total_records: registrations.length,
            exported_at: new Date().toISOString(),
            filters: filters,
          },
        });
      }
    } catch (error) {
      console.error("Export registrations error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export registrations",
      });
    }
  },

  // Export posts
  async exportPosts(req, res) {
    try {
      const { format = "json", ...filters } = req.query;
      const validFormats = ["json", "csv"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format không hợp lệ. Chọn: json, csv",
        });
      }

      const posts = await Export.exportPostsAndComments(filters);
      const filename = ExportUtils.generateFilename("posts", format);

      if (format === "csv") {
        const fields = ExportUtils.getFieldsForType("posts");
        const csv = ExportUtils.convertToCSV(posts, fields);

        ExportUtils.setExportHeaders(res, filename, "csv");
        return res.send(csv);
      } else {
        ExportUtils.setExportHeaders(res, filename, "json");
        return res.json({
          success: true,
          data: posts,
          metadata: {
            total_records: posts.length,
            exported_at: new Date().toISOString(),
            filters: filters,
          },
        });
      }
    } catch (error) {
      console.error("Export posts error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export posts",
      });
    }
  },

  // Export summary report
  async exportSummary(req, res) {
    try {
      const { format = "json" } = req.query;
      const validFormats = ["json", "csv"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format không hợp lệ. Chọn: json, csv",
        });
      }

      const summary = await Export.exportSummaryStats();
      const filename = ExportUtils.generateFilename("summary_report", format);

      if (format === "csv") {
        const data = [summary];
        const fields = Object.keys(summary).map((key) => ({
          label: key,
          value: key,
        }));
        const csv = ExportUtils.convertToCSV(data, fields);

        ExportUtils.setExportHeaders(res, filename, "csv");
        return res.send(csv);
      } else {
        ExportUtils.setExportHeaders(res, filename, "json");
        return res.json({
          success: true,
          data: summary,
          metadata: {
            exported_at: new Date().toISOString(),
            report_type: "summary_statistics",
          },
        });
      }
    } catch (error) {
      console.error("Export summary error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export summary",
      });
    }
  },

  // Export tất cả data (comprehensive report)
  async exportAll(req, res) {
    try {
      const { format = "json", ...filters } = req.query;
      const validFormats = ["json"];

      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Comprehensive export chỉ hỗ trợ JSON format",
        });
      }

      const [users, events, registrations, posts, summary] = await Promise.all([
        Export.exportUsers(),
        Export.exportEvents(),
        Export.exportRegistrations(),
        Export.exportPostsAndComments(),
        Export.exportSummaryStats(),
      ]);

      const comprehensiveData = {
        metadata: {
          exported_at: new Date().toISOString(),
          total_records: {
            users: users.length,
            events: events.length,
            registrations: registrations.length,
            posts: posts.length,
          },
        },
        summary,
        data: {
          users,
          events,
          registrations,
          posts,
        },
      };

      const filename = ExportUtils.generateFilename(
        "volunteerhub_comprehensive_report",
        "json"
      );
      ExportUtils.setExportHeaders(res, filename, "json");

      return res.json(comprehensiveData);
    } catch (error) {
      console.error("Export all error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi export comprehensive report",
      });
    }
  },
};

export default exportController;
