import { Op } from "sequelize";
import sequelize from "../config/db.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Event from "../models/Event.js";
import Category from "../models/Category.js";
import Registration from "../models/Registration.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { PostReaction } from "../models/Reaction.js";

class ExportService {
  static async exportUsers(filters = {}) {
    try {
      const { role, status, search } = filters;

      const whereCondition = {};
      if (status) whereCondition.status = status;
      if (search) {
        whereCondition[Op.or] = [
          { full_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const roleInclude = {
        model: Role,
        as: "role",
        attributes: ["name"],
      };
      if (role) {
        roleInclude.where = { name: role };
      }

      const users = await User.findAll({
        where: whereCondition,
        attributes: [
          "user_id",
          "email",
          "full_name",
          "phone",
          "avatar_url",
          "status",
          "created_at",
          "updated_at",
        ],
        include: [roleInclude],
        order: [["created_at", "DESC"]],
      });

      return users.map((user) => {
        const u = user.get({ plain: true });
        return {
          ...u,
          role_name: u.role?.name,
        };
      });
    } catch (error) {
      throw new Error(`Service error in exportUsers: ${error.message}`);
    }
  }

  static async exportEvents(filters = {}) {
    try {
      const { category, status, search, date_from, date_to } = filters;

      const whereCondition = { is_deleted: false };

      if (status) whereCondition.approval_status = status;
      if (search) {
        whereCondition[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      if (date_from || date_to) {
        whereCondition.start_date = {};
        if (date_from) whereCondition.start_date[Op.gte] = new Date(date_from);
        if (date_to) whereCondition.start_date[Op.lte] = new Date(date_to);
      }

      const includeOptions = [
        {
          model: User,
          as: "manager",
          attributes: ["full_name"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["name"],
        },
      ];

      if (category) {
        includeOptions[1].where = { name: category };
      }

      const events = await Event.findAll({
        where: whereCondition,
        include: includeOptions,
        order: [["created_at", "DESC"]],
      });

      return events.map((event) => {
        const e = event.get({ plain: true });
        return {
          event_id: e.event_id,
          title: e.title,
          description: e.description,
          location: e.location,
          start_date: e.start_date,
          end_date: e.end_date,
          target_participants: e.target_participants,
          current_participants: e.current_participants,
          approval_status: e.approval_status,
          approved_by: e.approved_by,
          approval_date: e.approval_date,
          created_at: e.created_at,
          category_name: e.category?.name,
          manager_name: e.manager?.full_name,
        };
      });
    } catch (error) {
      throw new Error(`Service error in exportEvents: ${error.message}`);
    }
  }

  static async exportRegistrations(filters = {}) {
    try {
      const { event_id, status, date_from, date_to } = filters;
      const whereCondition = {};

      if (event_id) whereCondition.event_id = event_id;
      if (status) whereCondition.status = status;

      if (date_from || date_to) {
        whereCondition.registration_date = {};
        if (date_from)
          whereCondition.registration_date[Op.gte] = new Date(date_from);
        if (date_to)
          whereCondition.registration_date[Op.lte] = new Date(date_to);
      }

      const registrations = await Registration.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "full_name", "email"],
          },
          {
            model: Event,
            as: "event",
            attributes: ["event_id", "title"],
          },
        ],
        order: [["registration_date", "DESC"]],
      });

      return registrations.map((reg) => {
        const r = reg.get({ plain: true });
        return {
          registration_id: r.registration_id,
          registration_date: r.registration_date,
          status: r.status,
          rejection_reason: r.rejection_reason,
          completion_date: r.completion_date,
          user_id: r.user?.user_id,
          volunteer_name: r.user?.full_name,
          volunteer_email: r.user?.email,
          event_id: r.event?.event_id,
          event_title: r.event?.title,
        };
      });
    } catch (error) {
      throw new Error(`Service error in exportRegistrations: ${error.message}`);
    }
  }

  static async exportPostsAndComments(filters = {}) {
    try {
      const { event_id, date_from, date_to } = filters;
      const whereCondition = {};

      if (event_id) whereCondition.event_id = event_id;
      if (date_from || date_to) {
        whereCondition.created_at = {};
        if (date_from) whereCondition.created_at[Op.gte] = new Date(date_from);
        if (date_to) whereCondition.created_at[Op.lte] = new Date(date_to);
      }

      const posts = await Post.findAll({
        where: whereCondition,
        attributes: [
          "post_id",
          "event_id",
          "user_id",
          "content",
          "created_at",
          "updated_at",
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Post.post_id)`
            ),
            "comment_count",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM PostReactions WHERE PostReactions.post_id = Post.post_id)`
            ),
            "reaction_count",
          ],
        ],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["full_name"],
          },
          {
            model: Event,
            as: "event",
            attributes: ["title"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return posts.map((post) => {
        const p = post.get({ plain: true });
        return {
          post_id: p.post_id,
          event_id: p.event_id,
          event_title: p.event?.title,
          user_id: p.user_id,
          author_name: p.user?.full_name,
          content: p.content,
          created_at: p.created_at,
          updated_at: p.updated_at,
          comment_count: p.comment_count,
          reaction_count: p.reaction_count,
        };
      });
    } catch (error) {
      throw new Error(`Service error in exportPosts: ${error.message}`);
    }
  }

  static async exportSummaryStats() {
    try {
      const [
        totalActiveUsers,
        totalApprovedEvents,
        totalCompletedRegs,
        totalPosts,
        totalComments,
        upcomingEvents,
        avgParticipants,
        uniqueVolunteers,
      ] = await Promise.all([
        User.count({ where: { status: "Active" } }),
        Event.count({
          where: { approval_status: "approved", is_deleted: false },
        }),
        Registration.count({ where: { status: "completed" } }),
        Post.count(),
        Comment.count(),
        Event.count({
          where: {
            start_date: { [Op.gte]: new Date() },
            approval_status: "approved",
            is_deleted: false,
          },
        }),
        Event.findOne({
          where: { approval_status: "approved", is_deleted: false },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("current_participants")), "avg"],
          ],
        }),
        Registration.count({
          where: { status: "approved" },
          distinct: true,
          col: "user_id",
        }),
      ]);

      return {
        total_active_users: totalActiveUsers,
        total_approved_events: totalApprovedEvents,
        total_completed_registrations: totalCompletedRegs,
        total_posts: totalPosts,
        total_comments: totalComments,
        upcoming_events: upcomingEvents,
        avg_participants_per_event: avgParticipants?.get("avg") || 0,
        unique_volunteers: uniqueVolunteers,
      };
    } catch (error) {
      throw new Error(`Service error in exportSummary: ${error.message}`);
    }
  }
}

export default ExportService;