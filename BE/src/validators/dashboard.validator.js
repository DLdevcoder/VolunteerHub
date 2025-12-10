import Joi from 'joi';

const dashboardValidator = {
  // Query params cho time series và trends
  timeRangeQuery: Joi.object({
    time_range: Joi.string()
      .valid('7d', '30d', '12m')
      .default('7d')
      .messages({
        'any.only': 'Khoảng thời gian không hợp lệ. Chọn: 7d, 30d, 12m'
      })
  }),

  // Query params cho registration trends
  registrationTimeRangeQuery: Joi.object({
    time_range: Joi.string()
      .valid('7d', '30d')
      .default('7d')
      .messages({
        'any.only': 'Khoảng thời gian không hợp lệ. Chọn: 7d, 30d'
      })
  }),

  // Query params cho limit
  limitQuery: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit phải là số',
        'number.min': 'Limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Limit không được vượt quá 100'
      })
  }),

  // Query params cho full dashboard
  fullDashboardQuery: Joi.object({
    time_range: Joi.string()
      .valid('7d', '30d', '12m')
      .default('7d')
      .messages({
        'any.only': 'Khoảng thời gian không hợp lệ. Chọn: 7d, 30d, 12m'
      }),
    
    events_limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Events limit phải là số',
        'number.min': 'Events limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Events limit không được vượt quá 50'
      }),
    
    users_limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Users limit phải là số',
        'number.min': 'Users limit phải lớn hơn hoặc bằng 1',
        'number.max': 'Users limit không được vượt quá 50'
      })
  })
};

export default dashboardValidator;