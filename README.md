
<div align="center">

# VolunteerHub – Volunteer Connection Platform

</div>

**VolunteerHub** is a comprehensive volunteer management and connection system.  
The application enables **Volunteers** to discover and register for events, **Event Managers** to coordinate activities, and **Administrators** to oversee the entire system in a transparent and efficient manner.

<div align="center">

[Installation & Running the Project](#installation--running-the-project) . [Tech Stack](#tech-stack) . [System Requirements](#system-requirements) . [Core Business Flows](#core-business-flows) . [Support](#support)

</div>

---

## Installation & Running the Project

The project is divided into two main parts: **Backend (BE)** and **Frontend (FE)**.

### 1. Run Backend
```bash
cd BE
npm install
```
**Generate VAPID Keys:** To enable Web Push Notifications, you need to generate a unique pair of VAPID keys. Run the following command in your terminal:
```bash
npx web-push generate-vapid-keys
```
*Copy the Public Key and Private Key output from the terminal.*

**Configuration:** Create a ```.env``` file in the ```BE``` folder and update it with your database info and the generated keys:
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=volunteerhub_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=volunteerhub_super_secret_key # ⚠️ IN PRODUCTION: Change this to a strong random string!
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Web Push Notification Keys (Paste the generated keys here)
VAPID_PUBLIC_KEY=<paste_your_generated_public_key_here>
VAPID_PRIVATE_KEY=<paste_your_generated_private_key_here>
```

**Run Server:**
```bash
npm run dev
```

### 2. Run Frontend

```bash
cd FE/vite-project
npm install
npm run dev
```
---

## Tech Stack

### Backend (Node.js)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Bcrypt](https://img.shields.io/badge/Bcrypt-Security-red?style=for-the-badge&logo=security&logoColor=white)](https://www.npmjs.com/package/bcrypt)
[![Joi](https://img.shields.io/badge/Joi-Validation-323330?style=for-the-badge&logo=npm)](https://joi.dev/)
[![Web Push](https://img.shields.io/badge/Web_Push-Notifications-FF6F00?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
[![json2csv](https://img.shields.io/badge/json2csv-Data_Export-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white)](https://www.npmjs.com/package/json2csv)

### Frontend (React)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## System Requirements

Ensure your system meets the following requirements before working with the project:

- **Node.js:** v16.x or higher
- **npm:** v8.x or higher (or yarn / pnpm)
- **Database:** MySQL v8.x
- **Browser:** Latest version of Chrome, Edge, or Firefox
- **Operating System:** Windows, macOS, or Linux

Optional but recommended:
- **Git:** Latest version
- **Postman:** For API testing

---

##  Core Business Flows

### 👤 Volunteer
- **Account Management:** Register, log in, and manage personal profile.
- **Events:** Browse events, filter by time or category, register or cancel participation.
- **Interaction:** Create posts, comment, and react (similar to a Facebook-style wall) on approved events.
- **Notifications:** Receive real-time registration status updates via Web Push API.
- **Dashboard:** Track featured events, newly published events, and participation history.

### 🏢 Event Manager
- **Event Operations:** Create, update, and delete events with strict data validation.
- **Approval Workflow:** Approve or reject volunteer participation requests.
- **Post-event Processing:** Mark volunteer completion status after each event.
- **Engagement:** Manage and participate in event discussion channels.
- **Dashboard:** View statistics on event participation and engagement.

### 🛡️ Administrator (Admin)
- **Moderation:** Approve or remove events across the system.
- **User Management:** View, lock, or unlock user accounts.
- **Data Management:** Export event and user reports in CSV or JSON format.
- **System Overview:** Monitor overall system trends and activities.

---

##  Support
If you find this project useful, please consider giving it a star on GitHub.
