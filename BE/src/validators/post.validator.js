import Joi from 'joi';

const postValidator = {
  // Query params cho get posts
  getPosts: Joi.object({
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
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 50'
      })
  }),

  // Tạo bài đăng
  createPost: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(2000)
      .required()
      .messages({
        'string.empty': 'Nội dung không được để trống',
        'string.min': 'Nội dung không được để trống',
        'string.max': 'Nội dung quá dài (tối đa 2000 ký tự)',
        'any.required': 'Nội dung là bắt buộc'
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
  }),

  postIdParams: Joi.object({
    post_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Post ID phải là số',
        'number.integer': 'Post ID phải là số nguyên',
        'number.positive': 'Post ID phải là số dương',
        'any.required': 'Post ID là bắt buộc'
      })
  })
};

export default postValidator;