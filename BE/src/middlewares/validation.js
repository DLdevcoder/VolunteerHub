import Joi from 'joi';

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log(`Validating ${property}:`, req[property]);
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.log('Validation errors:', error.details);
      
      let errorMessage = '';
      
      if (error.details.length === 1) {
        const detail = error.details[0];
        errorMessage = getVietnameseMessage(detail);
      } else {
        const fieldNames = error.details.map(detail => {
          const field = detail.path[0];
          return mapFieldToVietnamese(field);
        });
        
        errorMessage = `Vui lòng kiểm tra: ${fieldNames.join(', ')}`;
      }
      
      console.log('Sending to FE:', { success: false, message: errorMessage });
      
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    console.log('Validation passed');
    req[property] = value;
    next();
  };
};

function mapFieldToVietnamese(field) {
  const map = {
    'email': 'email',
    'password': 'mật khẩu',
    'full_name': 'họ tên',
    'phone': 'số điện thoại',
    'role_name': 'vai trò',
    'current_password': 'mật khẩu hiện tại',
    'new_password': 'mật khẩu mới',
    'confirm_password': 'xác nhận mật khẩu',
    'refresh_token': 'refresh token'
  };
  
  return map[field] || field;
}

function getVietnameseMessage(detail) {
  const field = detail.path[0];
  const fieldVi = mapFieldToVietnamese(field);
  
  switch (detail.type) {
    case 'string.email':
      return 'Email không hợp lệ';
      
    case 'string.min':
      const min = detail.context.limit;
      if (field === 'password' || field === 'new_password') {
        return `Mật khẩu phải có ít nhất ${min} ký tự`;
      } else if (field === 'full_name') {
        return `Họ tên phải có ít nhất ${min} ký tự`;
      }
      return `${fieldVi} phải có ít nhất ${min} ký tự`;
      
    case 'string.pattern.base':
      if (field === 'phone') {
        return 'Số điện thoại không hợp lệ (10-11 số)';
      }
      return `${fieldVi} không đúng định dạng`;
      
    case 'any.only':
      if (field === 'role_name') {
        return 'Vai trò phải là một trong: Volunteer, Admin, Organizer';
      } else if (field === 'confirm_password') {
        return 'Mật khẩu mới và xác nhận mật khẩu không khớp';
      }
      return `${fieldVi} không hợp lệ`;
      
    case 'any.required':
      return `${fieldVi} là bắt buộc`;
      
    case 'string.empty':
      return `Vui lòng nhập ${fieldVi}`;
      
    case 'any.custom':
      return detail.message || `Lỗi ${fieldVi}`;
      
    default:
      let message = detail.message;
      if (message.startsWith('"') && message.endsWith('"')) {
        message = message.slice(1, -1);
      }
      return message;
  }
}

export default validate;