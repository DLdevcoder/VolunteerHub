import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Post from "../models/Post.js";
import Event from "../models/Event.js";

class CommentService {
  static async create({ post_id, user_id, content }) {
    try {
      const newComment = await Comment.create({ post_id, user_id, content });
      return newComment.comment_id;
    } catch (error) {
      throw new Error(`Service Create Error: ${error.message}`);
    }
  }

  static async getByPostId(post_id, page = 1, limit = 20) {
    try {
      const numLimit = Number(limit) || 20;
      const offset = (Number(page || 1) - 1) * numLimit;

      const { count, rows } = await Comment.findAndCountAll({
        where: { post_id },
        limit: numLimit,
        offset: offset,
        order: [["created_at", "ASC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "full_name", "avatar_url"],
            include: [
              {
                model: Role,
                as: "role",
                attributes: ["name"],
              },
            ],
          },
        ],
      });

      const comments = rows.map((item) => {
        const c = item.get({ plain: true });
        return {
          comment_id: c.comment_id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user?.user_id,
          full_name: c.user?.full_name,
          avatar_url: c.user?.avatar_url,
          role_name: c.user?.role?.name || null,
        };
      });

      return {
        comments,
        pagination: {
          total: count,
          page: Number(page),
          limit: numLimit,
          totalPages: Math.ceil(count / numLimit),
        },
      };
    } catch (error) {
      throw new Error(`Service GetByPostId Error: ${error.message}`);
    }
  }

  static async getById(comment_id) {
    try {
      const comment = await Comment.findOne({
        where: { comment_id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["full_name", "avatar_url"],
          },
          {
            model: Post,
            as: "post",
            attributes: ["event_id"],
            include: [
              {
                model: Event,
                as: "event",
                attributes: ["manager_id", "is_deleted", "approval_status"],
              },
            ],
          },
        ],
      });

      if (!comment) return null;

      const c = comment.get({ plain: true });

      return {
        ...c,
        full_name: c.user?.full_name,
        avatar_url: c.user?.avatar_url,
        event_id: c.post?.event_id,
        event_manager_id: c.post?.event?.manager_id,
        event_is_deleted: c.post?.event?.is_deleted,
        event_status: c.post?.event?.approval_status,
      };
    } catch (error) {
      throw new Error(`Service GetById Error: ${error.message}`);
    }
  }

  static async delete(comment_id) {
    try {
      const deletedCount = await Comment.destroy({ where: { comment_id } });
      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Service Delete Error: ${error.message}`);
    }
  }
}

export default CommentService;