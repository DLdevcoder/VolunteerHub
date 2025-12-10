import Joi from 'joi';

const userValidator = {
  // Cập nhật thông tin cá nhân
  updateMe: Joi.object({
    full_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Họ tên không được để trống',
        'string.min': 'Họ tên phải có ít nhất 2 ký tự',
        'string.max': 'Họ tên không được vượt quá 100 ký tự',
        'any.required': 'Họ tên là bắt buộc'
      }),
    
    phone: Joi.string()
      .pattern(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ. Ví dụ: 0912345678 hoặc +84912345678'
      }),
    
    avatar_url: Joi.string()
      .uri()
      .optional()
      .allow('')
      .messages({
        'string.uri': 'URL avatar không hợp lệ'
      })
  }),

  // Query params cho get all users
  getAllUsers: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page phải là số',
        'number.min': 'Page phải lớn hơn hoặc bằng 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 100'
      }),
    
    search: Joi.string()
      .max(100)
      .trim()
      .optional()
      .allow('')
      .messages({
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự'
      }),
    
    role: Joi.string()
      .valid('Volunteer', 'Organization', 'Admin')
      .optional()
      .allow('')
      .messages({
        'any.only': 'Vai trò không hợp lệ. Chọn: Volunteer, Organization, Admin'
      }),
    
    status: Joi.string()
      .valid('Active', 'Locked', 'Suspended')
      .optional()
      .allow('')
      .messages({
        'any.only': 'Trạng thái không hợp lệ. Chọn: Active, Locked, Suspended'
      })
  }),

  // Validate user ID params
  userIdParams: Joi.object({
    user_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID phải là số',
        'number.integer': 'User ID phải là số nguyên',
        'number.positive': 'User ID phải là số dương',
        'any.required': 'User ID là bắt buộc'
      })
  }),

  // Cập nhật trạng thái user (Admin)
  updateUserStatus: Joi.object({
    status: Joi.string()
      .valid('Active', 'Locked', 'Suspended')
      .required()
      .messages({
        'any.only': 'Trạng thái không hợp lệ. Chọn: Active, Locked, Suspended',
        'any.required': 'Trạng thái là bắt buộc'
      }),
    
    reason: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Lý do không được vượt quá 500 ký tự'
      })
  }),

  // Cập nhật role user (Admin)
  updateUserRole: Joi.object({
    role_name: Joi.string()
      .valid('Volunteer', 'Organization', 'Admin')
      .required()
      .messages({
        'any.only': 'Vai trò không hợp lệ. Chọn: Volunteer, Organization, Admin',
        'any.required': 'Vai trò là bắt buộc'
      })
  })
};

export default userValidator;