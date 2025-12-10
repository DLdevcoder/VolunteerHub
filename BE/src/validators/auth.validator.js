import Joi from 'joi';
import validate from '../middlewares/validation.js';

// Schema đăng ký
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập email',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu là bắt buộc'
    }),
  
  full_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập họ tên',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được vượt quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập số điện thoại',
      'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)',
      'any.required': 'Số điện thoại là bắt buộc'
    }),
  
  role_name: Joi.string()
    .valid('Volunteer', 'Admin', 'Organizer')
    .default('Volunteer')
    .messages({
      'any.only': 'Vai trò phải là một trong: Volunteer, Admin, Organizer'
    })
})
.custom((value, helpers) => {
  const missingFields = [];
  
  if (!value.email) missingFields.push('email');
  if (!value.password) missingFields.push('mật khẩu');
  if (!value.full_name) missingFields.push('họ tên');
  if (!value.phone) missingFields.push('số điện thoại');
  
  if (missingFields.length > 0) {
    return helpers.error('any.custom', {
      message: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`
    });
  }
  
  return value;
});

// Schema đăng nhập
const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập email',
      'any.required': 'Email là bắt buộc'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu',
      'any.required': 'Mật khẩu là bắt buộc'
    })
})
.custom((value, helpers) => {
  if (!value.email && !value.password) {
    return helpers.error('any.custom', {
      message: 'Vui lòng cung cấp email và password'
    });
  }
  return value;
});

// Schema refresh token
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token là bắt buộc',
      'any.required': 'Refresh token là bắt buộc'
    })
});

// Schema đổi mật khẩu
const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu hiện tại',
      'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
  
  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.empty': 'Vui lòng nhập mật khẩu mới',
      'any.required': 'Mật khẩu mới là bắt buộc'
    }),
  
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Mật khẩu mới và xác nhận mật khẩu không khớp',
      'string.empty': 'Vui lòng xác nhận mật khẩu',
      'any.required': 'Xác nhận mật khẩu là bắt buộc'
    })
})
.custom((value, helpers) => {
  const missingFields = [];
  if (!value.current_password) missingFields.push('mật khẩu hiện tại');
  if (!value.new_password) missingFields.push('mật khẩu mới');
  if (!value.confirm_password) missingFields.push('xác nhận mật khẩu');
  
  if (missingFields.length > 0) {
    return helpers.error('any.custom', {
      message: `Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`
    });
  }
  
  if (value.new_password !== value.confirm_password) {
    return helpers.error('any.custom', {
      message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
    });
  }
  
  if (value.current_password === value.new_password) {
    return helpers.error('any.custom', {
      message: 'Mật khẩu mới không được giống mật khẩu cũ'
    });
  }
  
  return value;
});

// Export validation middleware
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateChangePassword = validate(changePasswordSchema);

export default {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword
};