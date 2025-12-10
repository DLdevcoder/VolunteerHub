import Joi from 'joi';

const exportValidator = {
  // Common export query params
  commonExportQuery: Joi.object({
    format: Joi.string()
      .valid('json', 'csv')
      .default('json')
      .messages({
        'any.only': 'Format không hợp lệ. Chọn: json, csv'
      }),
    
    // Users filters
    role: Joi.string()
      .valid('Volunteer', 'Manager', 'Admin')
      .optional()
      .messages({
        'any.only': 'Vai trò không hợp lệ. Chọn: Volunteer, Manager, Admin'
      }),
    
    status: Joi.string()
      .valid('Active', 'Locked', 'Suspended')
      .optional()
      .messages({
        'any.only': 'Trạng thái không hợp lệ. Chọn: Active, Locked, Suspended'
      }),
    
    // Events filters
    approval_status: Joi.string()
      .valid('pending', 'approved', 'rejected')
      .optional()
      .messages({
        'any.only': 'Trạng thái duyệt không hợp lệ. Chọn: pending, approved, rejected'
      }),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID phải là số',
        'number.integer': 'Category ID phải là số nguyên',
        'number.positive': 'Category ID phải là số dương'
      }),
    
    manager_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Manager ID phải là số',
        'number.integer': 'Manager ID phải là số nguyên',
        'number.positive': 'Manager ID phải là số dương'
      }),
    
    // Registrations filters
    registration_status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'cancelled', 'completed')
      .optional()
      .messages({
        'any.only': 'Trạng thái đăng ký không hợp lệ. Chọn: pending, approved, rejected, cancelled, completed'
      }),
    
    event_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương'
      }),
    
    // Date range filters
    start_date_from: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày bắt đầu từ không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    start_date_to: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày bắt đầu đến không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    created_from: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày tạo từ không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    created_to: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Ngày tạo đến không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    // Pagination (optional for export)
    limit: Joi.number()
      .integer()
      .min(1)
      .max(5000)
      .optional()
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 5000'
      })
  }),

  // Export summary (chỉ có format)
  exportSummaryQuery: Joi.object({
    format: Joi.string()
      .valid('json', 'csv')
      .default('json')
      .messages({
        'any.only': 'Format không hợp lệ. Chọn: json, csv'
      })
  }),

  // Export all (chỉ hỗ trợ JSON)
  exportAllQuery: Joi.object({
    format: Joi.string()
      .valid('json')
      .default('json')
      .messages({
        'any.only': 'Comprehensive export chỉ hỗ trợ JSON format'
      }),
    
    // Có thể thêm các filter khác nếu cần
    limit_per_type: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Limit per type phải là số',
        'number.min': 'Limit per type phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit per type không được vượt quá 1000'
      })
  })
};

export default exportValidator;