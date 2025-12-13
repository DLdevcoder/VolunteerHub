import { Parser } from "json2csv";

class ExportUtils {
  // Format datetime helper
  static formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `\u200B${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Format data trước khi convert
  static formatDataForExport(data, dataType) {
    const dateFields = {
      users: ['created_at', 'updated_at'],
      events: ['start_date', 'end_date', 'approval_date', 'created_at'],
      registrations: ['registration_date', 'completion_date'],
      posts: ['created_at']
    };

    const fieldsToFormat = dateFields[dataType] || [];

    return data.map(item => {
      const formatted = { ...item };
      fieldsToFormat.forEach(field => {
        if (formatted[field]) {
          formatted[field] = this.formatDateTime(formatted[field]);
        }
      });
      return formatted;
    });
  }

  // Convert JSON to CSV với UTF-8 BOM support và format dates
  static convertToCSV(data, fields, dataType) {
    try {
      // Format dates trước khi convert
      const formattedData = this.formatDataForExport(data, dataType);

      const json2csvParser = new Parser({
        fields,
        quote: '"',           // Luôn bọc trong ngoặc kép
        escapedQuote: '""',
        excelStrings: false,
        withBOM: false
      });
      const csv = json2csvParser.parse(formattedData);
      // Thêm BOM cho UTF-8
      return '\ufeff' + csv;
    } catch (error) {
      throw new Error(`CSV conversion error: ${error.message}`);
    }
  }

  // Format filename với timestamp
  static generateFilename(prefix, format) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    return `${prefix}_${timestamp}.${format}`;
  }

  // Field mappings cho các loại data
  static getFieldsForType(dataType) {
    const fieldMappings = {
      users: [
        { label: "User ID", value: "user_id" },
        { label: "Email", value: "email" },
        { label: "Full Name", value: "full_name" },
        { label: "Phone", value: "phone" },
        { label: "Role", value: "role_name" },
        { label: "Status", value: "status" },
        { label: "Created At", value: "created_at" },
        { label: "Updated At", value: "updated_at" },
      ],
      events: [
        { label: "Event ID", value: "event_id" },
        { label: "Title", value: "title" },
        { label: "Description", value: "description" },
        { label: "Location", value: "location" },
        { label: "Start Date", value: "start_date" },
        { label: "End Date", value: "end_date" },
        { label: "Target Participants", value: "target_participants" },
        { label: "Current Participants", value: "current_participants" },
        { label: "Category", value: "category_name" },
        { label: "Manager", value: "manager_name" },
        { label: "Approval Status", value: "approval_status" },
        { label: "Approval Date", value: "approval_date" },
        { label: "Created At", value: "created_at" },
      ],
      registrations: [
        { label: "Registration ID", value: "registration_id" },
        { label: "User ID", value: "user_id" },
        { label: "Volunteer Name", value: "volunteer_name" },
        { label: "Volunteer Email", value: "volunteer_email" },
        { label: "Event ID", value: "event_id" },
        { label: "Event Title", value: "event_title" },
        { label: "Registration Date", value: "registration_date" },
        { label: "Status", value: "status" },
        { label: "Rejection Reason", value: "rejection_reason" },
        { label: "Completion Date", value: "completion_date" },
      ],
      posts: [
        { label: "Post ID", value: "post_id" },
        { label: "Event ID", value: "event_id" },
        { label: "Event Title", value: "event_title" },
        { label: "Author ID", value: "user_id" },
        { label: "Author Name", value: "author_name" },
        { label: "Content", value: "content" },
        { label: "Comment Count", value: "comment_count" },
        { label: "Reaction Count", value: "reaction_count" },
        { label: "Created At", value: "created_at" },
      ],
    };

    return (
      fieldMappings[dataType] ||
      Object.keys(data[0] || {}).map((key) => ({ label: key, value: key }))
    );
  }

  // Set response headers cho file download
  static setExportHeaders(res, filename, format) {
    const contentType = format === "csv"
      ? "text/csv; charset=utf-8"
      : "application/json; charset=utf-8";
    const contentDisposition = `attachment; filename="${filename}"`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("Cache-Control", "no-cache");
  }
}

export default ExportUtils;