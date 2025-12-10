import Joi from 'joi';

const notificationValidator = {
  // Query params cho get notifications
  getNotifications: Joi.object({
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
      .default(20)
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 100'
      }),
    
    is_read: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Trạng thái đọc phải là true hoặc false'
      }),
    
    type: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Loại thông báo không được vượt quá 50 ký tự'
      })
  }),

  // Query params cho get recent notifications
  getRecent: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 50'
      })
  }),

  // Validate notification ID params
  notificationIdParams: Joi.object({
    notification_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Notification ID phải là số',
        'number.integer': 'Notification ID phải là số nguyên',
        'number.positive': 'Notification ID phải là số dương',
        'any.required': 'Notification ID là bắt buộc'
      })
  }),

  // Thông báo duyệt sự kiện
  notifyEventApproval: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      }),
    
    is_approved: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'Trạng thái duyệt phải là true hoặc false',
        'any.required': 'Trạng thái duyệt là bắt buộc'
      }),
    
    rejection_reason: Joi.string()
      .max(500)
      .when('is_approved', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.max': 'Lý do từ chối không được vượt quá 500 ký tự',
        'any.required': 'Lý do từ chối là bắt buộc khi từ chối sự kiện'
      })
  }),

  // Thông báo đăng ký mới
  notifyNewRegistration: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      }),
    
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

  // Thông báo trạng thái đăng ký
  notifyRegistrationStatus: Joi.object({
    registration_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Registration ID phải là số',
        'number.integer': 'Registration ID phải là số nguyên',
        'number.positive': 'Registration ID phải là số dương',
        'any.required': 'Registration ID là bắt buộc'
      }),
    
    status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'cancelled', 'completed')
      .required()
      .messages({
        'any.only': 'Trạng thái không hợp lệ. Chọn: pending, approved, rejected, cancelled, completed',
        'any.required': 'Trạng thái là bắt buộc'
      }),
    
    rejection_reason: Joi.string()
      .max(500)
      .when('status', {
        is: 'rejected',
        then: Joi.required(),
        otherwise: Joi.optional().allow('')
      })
      .messages({
        'string.max': 'Lý do từ chối không được vượt quá 500 ký tự',
        'any.required': 'Lý do từ chối là bắt buộc khi từ chối đăng ký'
      })
  }),

  // Thông báo sự kiện (event_id là bắt buộc)
  eventIdRequired: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      })
  }),

  // Thông báo sự kiện bị hủy
  notifyEventCancelled: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      }),
    
    reason: Joi.string()
      .min(5)
      .max(500)
      .required()
      .messages({
        'string.empty': 'Lý do không được để trống',
        'string.min': 'Lý do phải có ít nhất 5 ký tự',
        'string.max': 'Lý do không được vượt quá 500 ký tự',
        'any.required': 'Lý do là bắt buộc'
      })
  }),

  // Thông báo cập nhật sự kiện khẩn
  notifyEventUpdatedUrgent: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      }),
    
    changes: Joi.object()
      .required()
      .messages({
        'object.base': 'Thông tin thay đổi phải là object',
        'any.required': 'Thông tin thay đổi là bắt buộc'
      })
  }),

  // Thông báo nội dung mới trên wall
  notifyNewContent: Joi.object({
    event_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Event ID phải là số',
        'number.integer': 'Event ID phải là số nguyên',
        'number.positive': 'Event ID phải là số dương',
        'any.required': 'Event ID là bắt buộc'
      }),
    
    content_type: Joi.string()
      .valid('post', 'comment')
      .required()
      .messages({
        'any.only': 'Loại nội dung không hợp lệ. Chọn: post, comment',
        'any.required': 'Loại nội dung là bắt buộc'
      }),
    
    content_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Content ID phải là số',
        'number.integer': 'Content ID phải là số nguyên',
        'number.positive': 'Content ID phải là số dương',
        'any.required': 'Content ID là bắt buộc'
      }),
    
    content_preview: Joi.string()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Preview không được vượt quá 100 ký tự'
      })
  }),

  // Thông báo lượt thích mới
  notifyNewReaction: Joi.object({
    content_type: Joi.string()
      .valid('post', 'comment')
      .required()
      .messages({
        'any.only': 'Loại nội dung không hợp lệ. Chọn: post, comment',
        'any.required': 'Loại nội dung là bắt buộc'
      }),
    
    content_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Content ID phải là số',
        'number.integer': 'Content ID phải là số nguyên',
        'number.positive': 'Content ID phải là số dương',
        'any.required': 'Content ID là bắt buộc'
      }),
    
    reactor_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Reactor ID phải là số',
        'number.integer': 'Reactor ID phải là số nguyên',
        'number.positive': 'Reactor ID phải là số dương',
        'any.required': 'Reactor ID là bắt buộc'
      }),
    
    content_owner_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Content Owner ID phải là số',
        'number.integer': 'Content Owner ID phải là số nguyên',
        'number.positive': 'Content Owner ID phải là số dương',
        'any.required': 'Content Owner ID là bắt buộc'
      })
  }),

  // Thông báo tài khoản bị khóa
  notifyAccountLocked: Joi.object({
    user_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID phải là số',
        'number.integer': 'User ID phải là số nguyên',
        'number.positive': 'User ID phải là số dương',
        'any.required': 'User ID là bắt buộc'
      }),
    
    reason: Joi.string()
      .min(5)
      .max(500)
      .required()
      .messages({
        'string.empty': 'Lý do không được để trống',
        'string.min': 'Lý do phải có ít nhất 5 ký tự',
        'string.max': 'Lý do không được vượt quá 500 ký tự',
        'any.required': 'Lý do là bắt buộc'
      })
  }),

  // Thông báo manager bị khóa
  notifyManagerLocked: Joi.object({
    manager_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Manager ID phải là số',
        'number.integer': 'Manager ID phải là số nguyên',
        'number.positive': 'Manager ID phải là số dương',
        'any.required': 'Manager ID là bắt buộc'
      }),
    
    reason: Joi.string()
      .min(5)
      .max(500)
      .required()
      .messages({
        'string.empty': 'Lý do không được để trống',
        'string.min': 'Lý do phải có ít nhất 5 ký tự',
        'string.max': 'Lý do không được vượt quá 500 ký tự',
        'any.required': 'Lý do là bắt buộc'
      })
  }),

  // Tạo thông báo tổng quát
  createNotification: Joi.object({
    user_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID phải là số',
        'number.integer': 'User ID phải là số nguyên',
        'number.positive': 'User ID phải là số dương',
        'any.required': 'User ID là bắt buộc'
      }),
    
    type: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.empty': 'Loại thông báo không được để trống',
        'string.max': 'Loại thông báo không được vượt quá 50 ký tự',
        'any.required': 'Loại thông báo là bắt buộc'
      }),
    
    payload: Joi.object()
      .optional()
      .default({})
      .messages({
        'object.base': 'Payload phải là object'
      })
  }),

  // Thông báo mở khóa tài khoản
  notifyAccountUnlocked: Joi.object({
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

  // Thông báo mở khóa manager
  notifyManagerUnlocked: Joi.object({
    manager_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Manager ID phải là số',
        'number.integer': 'Manager ID phải là số nguyên',
        'number.positive': 'Manager ID phải là số dương',
        'any.required': 'Manager ID là bắt buộc'
      })
  }),

  // Gửi thông báo hàng loạt
  bulkCreateNotifications: Joi.object({
    user_ids: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .required()
      .messages({
        'array.base': 'Danh sách user phải là mảng',
        'array.min': 'Phải có ít nhất 1 user trong danh sách',
        'number.base': 'User ID phải là số',
        'number.integer': 'User ID phải là số nguyên',
        'number.positive': 'User ID phải là số dương',
        'any.required': 'Danh sách user là bắt buộc'
      }),
    
    type: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.empty': 'Loại thông báo không được để trống',
        'string.max': 'Loại thông báo không được vượt quá 50 ký tự',
        'any.required': 'Loại thông báo là bắt buộc'
      }),
    
    payload: Joi.object()
      .optional()
      .default({})
      .messages({
        'object.base': 'Payload phải là object'
      })
  }),

  // User ID required (cho các API khác)
  userIdRequired: Joi.object({
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

  // Manager ID required
  managerIdRequired: Joi.object({
    manager_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Manager ID phải là số',
        'number.integer': 'Manager ID phải là số nguyên',
        'number.positive': 'Manager ID phải là số dương',
        'any.required': 'Manager ID là bắt buộc'
      })
  })
};

export default notificationValidator;