import { QueryTypes, Op } from "sequelize";
import sequelize from "../config/db.js";
import Registration from "../models/Registration.js";

class RegistrationService {
  static async create(user_id, event_id) {
    try {
      const newRegistration = await Registration.create({
        user_id,
        event_id,
        status: "pending",
      });
      return newRegistration.registration_id;
    } catch (error) {
      throw new Error(`Service error in create registration: ${error.message}`);
    }
  }

  static async cancel(user_id, event_id) {
    try {
      const [affectedCount] = await Registration.update(
        { status: "cancelled" },
        {
          where: {
            user_id: user_id,
            event_id: event_id,
            status: {
              [Op.in]: ["pending", "approved"],
            },
          },
        }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in cancel registration: ${error.message}`);
    }
  }

  static async getByEventId(event_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, 
            r.status, 
            r.registration_date, 
            r.rejection_reason,
            u.user_id, 
            u.full_name, 
            u.email, 
            u.phone, 
            u.avatar_url
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.event_id = ?
         ORDER BY r.registration_date DESC`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows;
    } catch (error) {
      throw new Error(`Service error in getByEventId: ${error.message}`);
    }
  }

  static async findOne(user_id, event_id) {
    try {
      const registration = await Registration.findOne({
        where: { user_id, event_id },
      });
      return registration;
    } catch (error) {
      throw new Error(`Service error in findOne registration: ${error.message}`);
    }
  }

  static async getHistoryByUserId(user_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, r.status as registration_status, r.registration_date,
            e.event_id, e.title, e.start_date, e.end_date, e.location,
            u.full_name as manager_name
         FROM Registrations r
         JOIN Events e ON r.event_id = e.event_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         WHERE r.user_id = ?
         ORDER BY r.registration_date DESC`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows;
    } catch (error) {
      throw new Error(`Service error in getHistoryByUserId: ${error.message}`);
    }
  }

  static async reRegister(user_id, event_id) {
    try {
      const [affectedCount] = await Registration.update(
        {
          status: "pending",
          registration_date: new Date(),
        },
        {
          where: { user_id, event_id },
        }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in reRegister: ${error.message}`);
    }
  }

  static async countRequests(event_id) {
    try {
      const count = await Registration.count({
        where: {
          event_id: event_id,
          status: {
            [Op.in]: ["pending", "approved"],
          },
        },
      });
      return count;
    } catch (error) {
      throw new Error(`Service error in countRequests: ${error.message}`);
    }
  }

  static async getDetailById(registration_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, 
            r.status, 
            r.user_id,       
            r.event_id,
            e.title as event_title, 
            e.manager_id,
            e.start_date, 
            e.end_date, 
            e.target_participants, 
            e.current_participants,
            e.is_deleted as event_is_deleted,
            u.full_name as volunteer_name,
            u.email as volunteer_email,
            u.status as user_status
         FROM Registrations r
         JOIN Events e ON r.event_id = e.event_id
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.registration_id = ?`,
        {
          replacements: [registration_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Service error in getDetailById: ${error.message}`);
    }
  }

  static async approve(registration_id) {
    try {
      const [affectedCount] = await Registration.update(
        {
          status: "approved",
          rejection_reason: null,
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in approve registration: ${error.message}`);
    }
  }

  static async reject(registration_id, reason) {
    try {
      const [affectedCount] = await Registration.update(
        {
          status: "rejected",
          rejection_reason: reason,
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in reject registration: ${error.message}`);
    }
  }

  static async complete(registration_id, manager_id) {
    try {
      const [affectedCount] = await Registration.update(
        {
          status: "completed",
          completed_by_manager_id: manager_id,
          completion_date: new Date(),
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(
        `Service error in complete registration: ${error.message}`
      );
    }
  }
}

export default RegistrationService;