# 🌟 VolunteerHub – Volunteer Connection Platform

**VolunteerHub** is a comprehensive volunteer management and connection system.  
The application enables **Volunteers** to discover and register for events, **Event Managers** to coordinate activities, and **Administrators** to oversee the entire system in a transparent and efficient manner.

---
## 🚀 Installation & Running the Project

The project is divided into two main parts: **Backend (BE)** and **Frontend (FE)**.

### 1. Run Backend
```bash
cd BE
npm install
npm run dev
```

### 2. Run Frontend

```bash
cd FE/vite-project
npm install
npm run dev
```
## 🛠 Tech Stack

### Backend (Node.js)
- **Framework:** Express.js
- **ORM:** Sequelize (MySQL)
- **Authentication:** JWT (JSON Web Token), Bcrypt / Bcryptjs
- **Validation:** Joi
- **Notifications:** Web Push API
- **Data Export:** json2csv

### Frontend (React)
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS

---

## ⚙️ System Requirements

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

## 📋 Core Business Flows

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

## ⭐ Support
If you find this project useful, please consider giving it a star on GitHub.
