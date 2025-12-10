import Joi from 'joi';

const commentValidator = {
  // Query params cho get comments
  getComments: Joi.object({
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
      })
  }),

  // Tạo bình luận
  createComment: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'Nội dung không được để trống',
        'string.min': 'Nội dung không được để trống',
        'string.max': 'Bình luận quá dài (tối đa 1000 ký tự)',
        'any.required': 'Nội dung là bắt buộc'
      })
  }),

  // Validate params
  commentParams: Joi.object({
    post_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Post ID phải là số',
        'number.positive': 'Post ID phải là số dương',
        'any.required': 'Post ID là bắt buộc'
      })
  }),

  deleteCommentParams: Joi.object({
    comment_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Comment ID phải là số',
        'number.positive': 'Comment ID phải là số dương',
        'any.required': 'Comment ID là bắt buộc'
      })
  })
};

export default commentValidator;