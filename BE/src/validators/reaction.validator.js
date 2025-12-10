import Joi from 'joi';

const reactionValidator = {
  // Toggle reaction (cho cả post và comment)
  toggleReaction: Joi.object({
    type: Joi.string()
      .valid('like', 'love', 'haha', 'sad', 'angry')
      .default('like')
      .messages({
        'any.only': 'Loại reaction không hợp lệ. Chọn: like, love, haha, sad, angry'
      })
  }),

  // Query params cho get reactions
  getReactions: Joi.object({
    type: Joi.string()
      .valid('like', 'love', 'haha', 'sad', 'angry')
      .optional()
      .messages({
        'any.only': 'Loại reaction không hợp lệ. Chọn: like, love, haha, sad, angry'
      })
  }),

  // Validate post ID params
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
  }),

  // Validate comment ID params
  commentIdParams: Joi.object({
    comment_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Comment ID phải là số',
        'number.integer': 'Comment ID phải là số nguyên',
        'number.positive': 'Comment ID phải là số dương',
        'any.required': 'Comment ID là bắt buộc'
      })
  })
};

export default reactionValidator;