// Authentication Validators
import authValidator from './auth.validator.js';

// Comment Validators
import commentValidator from './comment.validator.js';

// Event Validators
import eventValidator from './event.validator.js';

// Post Validators
import postValidator from './post.validator.js';

// Registration Validators
import registrationValidator from './registration.validator.js';

// User Validators
import userValidator from './user.validator.js';

// Notification Validators
import notificationValidator from './notification.validator.js';

// Reaction Validators
import reactionValidator from './reaction.validator.js';

// Dashboard Validators
import dashboardValidator from './dashboard.validator.js';

// WebPush Validators
import webPushValidator from './webPush.validator.js';

// Export Validators
import exportValidator from './export.validator.js';

const validators = {
  auth: authValidator,
  comment: commentValidator,
  event: eventValidator,
  post: postValidator,
  registration: registrationValidator,
  user: userValidator,

  notification: notificationValidator,
  reaction: reactionValidator,
  dashboard: dashboardValidator,
  webPush: webPushValidator,
  export: exportValidator
};

export default validators;
