import Joi from 'joi';

const webPushValidator = {
  // Save subscription
  saveSubscription: Joi.object({
    subscription: Joi.object({
      endpoint: Joi.string()
        .uri()
        .required()
        .messages({
          'string.empty': 'Endpoint không được để trống',
          'string.uri': 'Endpoint phải là URL hợp lệ',
          'any.required': 'Endpoint là bắt buộc'
        }),
      
      keys: Joi.object({
        p256dh: Joi.string()
          .required()
          .messages({
            'string.empty': 'p256dh key không được để trống',
            'any.required': 'p256dh key là bắt buộc'
          }),
        
        auth: Joi.string()
          .required()
          .messages({
            'string.empty': 'auth key không được để trống',
            'any.required': 'auth key là bắt buộc'
          })
      })
      .required()
      .messages({
        'object.base': 'Keys phải là object',
        'any.required': 'Keys là bắt buộc'
      }),
      
      expirationTime: Joi.number()
        .optional()
        .allow(null)
        .messages({
          'number.base': 'Expiration time phải là số'
        })
    })
    .required()
    .messages({
      'object.base': 'Subscription phải là object',
      'any.required': 'Subscription là bắt buộc'
    })
  }),

  // Unsubscribe
  unsubscribe: Joi.object({
    endpoint: Joi.string()
      .uri()
      .required()
      .messages({
        'string.empty': 'Endpoint không được để trống',
        'string.uri': 'Endpoint phải là URL hợp lệ',
        'any.required': 'Endpoint là bắt buộc'
      })
  })
};

export default webPushValidator;