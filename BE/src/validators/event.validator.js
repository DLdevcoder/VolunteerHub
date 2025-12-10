import Joi from 'joi';

const eventValidator = {
  // Tạo sự kiện
  createEvent: Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Tiêu đề không được để trống',
        'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
        'string.max': 'Tiêu đề không được vượt quá 200 ký tự',
        'any.required': 'Tiêu đề là bắt buộc'
      }),
    
    description: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.empty': 'Mô tả không được để trống',
        'string.min': 'Mô tả phải có ít nhất 10 ký tự',
        'string.max': 'Mô tả không được vượt quá 2000 ký tự',
        'any.required': 'Mô tả là bắt buộc'
      }),
    
    location: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Địa điểm không được để trống',
        'string.min': 'Địa điểm phải có ít nhất 5 ký tự',
        'string.max': 'Địa điểm không được vượt quá 200 ký tự',
        'any.required': 'Địa điểm là bắt buộc'
      }),
    
    start_date: Joi.date()
      .iso()
      .greater('now')
      .required()
      .messages({
        'date.base': 'Ngày bắt đầu không hợp lệ',
        'date.format': 'Ngày bắt đầu phải có định dạng YYYY-MM-DD HH:mm:ss',
        'date.greater': 'Ngày bắt đầu phải trong tương lai',
        'any.required': 'Ngày bắt đầu là bắt buộc'
      }),
    
    end_date: Joi.date()
      .iso()
      .greater(Joi.ref('start_date'))
      .required()
      .messages({
        'date.base': 'Ngày kết thúc không hợp lệ',
        'date.format': 'Ngày kết thúc phải có định dạng YYYY-MM-DD HH:mm:ss',
        'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
        'any.required': 'Ngày kết thúc là bắt buộc'
      })
      .custom((value, helpers) => {
        const { start_date } = helpers.state.ancestors[0];
        if (new Date(value).getTime() - new Date(start_date).getTime() < 15 * 60 * 1000) {
          return helpers.message('Thời lượng sự kiện quá ngắn (tối thiểu 15 phút)');
        }
        return value;
      }),
    
    target_participants: Joi.number()
      .integer()
      .min(1)
      .max(5000)
      .optional()
      .messages({
        'number.base': 'Số lượng người tham gia phải là số',
        'number.integer': 'Số lượng người tham gia phải là số nguyên',
        'number.min': 'Số lượng người tham gia phải lớn hơn 0',
        'number.max': 'Số lượng người tham gia không được vượt quá 5000'
      }),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Danh mục phải là số',
        'number.integer': 'Danh mục phải là số nguyên',
        'number.positive': 'Danh mục phải là số dương'
      })
  }),

  // Query params cho get all events
  getAllEvents: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page phải là số',
        'number.min': 'Page phải lớn hơn hoặc bằng 1'
      }),
    
    limit: Joi.alternatives()
      .try(
        Joi.number().integer().min(1).max(100).default(10),
        Joi.string().valid('all')
      )
      .default(10)
      .messages({
        'alternatives.match': 'Limit phải là số từ 1-100 hoặc "all"'
      }),
    
    approval_status: Joi.string()
      .valid('pending', 'approved', 'rejected')
      .messages({
        'any.only': 'Trạng thái duyệt không hợp lệ. Chọn: pending, approved, rejected'
      }),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .messages({
        'number.base': 'Danh mục phải là số',
        'number.integer': 'Danh mục phải là số nguyên',
        'number.positive': 'Danh mục phải là số dương'
      }),
    
    manager_id: Joi.number()
      .integer()
      .positive()
      .messages({
        'number.base': 'Manager ID phải là số',
        'number.integer': 'Manager ID phải là số nguyên',
        'number.positive': 'Manager ID phải là số dương'
      }),
    
    search: Joi.string()
      .max(100)
      .trim()
      .messages({
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự'
      }),
    
    start_date_from: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày bắt đầu từ không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    start_date_to: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày bắt đầu đến không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    sort_by: Joi.string()
      .valid('created_at', 'start_date', 'title', 'current_participants')
      .default('created_at')
      .messages({
        'any.only': 'Trường sắp xếp không hợp lệ'
      }),
    
    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
      .messages({
        'any.only': 'Thứ tự sắp xếp phải là ASC hoặc DESC'
      }),
    
    is_deleted: Joi.boolean()
      .messages({
        'boolean.base': 'Trạng thái xóa phải là true hoặc false'
      })
  }),

  // Query params cho get active events
  getActiveEvents: Joi.object({
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
    
    category_id: Joi.number()
      .integer()
      .positive()
      .messages({
        'number.base': 'Danh mục phải là số',
        'number.integer': 'Danh mục phải là số nguyên',
        'number.positive': 'Danh mục phải là số dương'
      }),
    
    search: Joi.string()
      .max(100)
      .trim()
      .messages({
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự'
      }),
    
    start_date_from: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày bắt đầu từ không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    start_date_to: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày bắt đầu đến không hợp lệ',
        'date.format': 'Ngày phải có định dạng YYYY-MM-DD HH:mm:ss'
      })
  }),

  // Cập nhật sự kiện
  updateEvent: Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .messages({
        'string.empty': 'Tiêu đề không được để trống',
        'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
        'string.max': 'Tiêu đề không được vượt quá 200 ký tự'
      }),
    
    description: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .messages({
        'string.empty': 'Mô tả không được để trống',
        'string.min': 'Mô tả phải có ít nhất 10 ký tự',
        'string.max': 'Mô tả không được vượt quá 2000 ký tự'
      }),
    
    location: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .messages({
        'string.empty': 'Địa điểm không được để trống',
        'string.min': 'Địa điểm phải có ít nhất 5 ký tự',
        'string.max': 'Địa điểm không được vượt quá 200 ký tự'
      }),
    
    start_date: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày bắt đầu không hợp lệ',
        'date.format': 'Ngày bắt đầu phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    end_date: Joi.date()
      .iso()
      .messages({
        'date.base': 'Ngày kết thúc không hợp lệ',
        'date.format': 'Ngày kết thúc phải có định dạng YYYY-MM-DD HH:mm:ss'
      }),
    
    target_participants: Joi.number()
      .integer()
      .min(1)
      .max(5000)
      .messages({
        'number.base': 'Số lượng người tham gia phải là số',
        'number.integer': 'Số lượng người tham gia phải là số nguyên',
        'number.min': 'Số lượng người tham gia phải lớn hơn 0',
        'number.max': 'Số lượng người tham gia không được vượt quá 5000'
      }),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .messages({
        'number.base': 'Danh mục phải là số',
        'number.integer': 'Danh mục phải là số nguyên',
        'number.positive': 'Danh mục phải là số dương'
      })
  }).min(1), // Ít nhất một field được update

  // Admin từ chối sự kiện
  rejectEvent: Joi.object({
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

  // Validate params
  eventIdParams: Joi.object({
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
  })
};

export default eventValidator;