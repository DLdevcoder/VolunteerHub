import Joi from 'joi';

const registrationValidator = {
  // Validate params chung
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
  }),

  registrationIdParams: Joi.object({
    registration_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Registration ID phải là số',
        'number.integer': 'Registration ID phải là số nguyên',
        'number.positive': 'Registration ID phải là số dương',
        'any.required': 'Registration ID là bắt buộc'
      })
  }),

  // Manager từ chối đăng ký
  rejectRegistration: Joi.object({
    reason: Joi.string()
      .trim()
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

  // Query params (nếu có phân trang trong future)
  getEventRegistrations: Joi.object({
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
    
    status: Joi.string()
      .valid('pending', 'approved', 'completed', 'rejected', 'cancelled')
      .messages({
        'any.only': 'Trạng thái không hợp lệ. Chọn: pending, approved, completed, rejected, cancelled'
      })
  })
};

export default registrationValidator;