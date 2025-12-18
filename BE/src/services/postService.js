import sequelize from "../config/db.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Event from "../models/Event.js";

class PostService {
  static async create({ event_id, user_id, content }) {
    try {
      const newPost = await Post.create({ event_id, user_id, content });
      return newPost.post_id;
    } catch (error) {
      throw new Error(`Service Create Post Error: ${error.message}`);
    }
  }

  static async getByEventId(
    event_id,
    page = 1,
    limit = 10,
    current_user_id = null
  ) {
    try {
      const numLimit = Number(limit) || 10;
      const offset = (Number(page || 1) - 1) * numLimit;

      const safeUserId = Number(current_user_id) || 0;
      const currentReactionSql = `(SELECT reaction_type FROM PostReactions WHERE post_id = Post.post_id AND user_id = ${safeUserId})`;

      const { count, rows } = await Post.findAndCountAll({
        where: { event_id },
        limit: numLimit,
        offset: offset,
        order: [["created_at", "DESC"]],
        attributes: [
          "post_id",
          "content",
          "created_at",
          "user_id",
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id)"
            ),
            "like_count",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM Comments WHERE post_id = Post.post_id)"
            ),
            "comment_count",
          ],
          [sequelize.literal(currentReactionSql), "current_reaction"],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='like')"
            ),
            "count_like",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='love')"
            ),
            "count_love",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='haha')"
            ),
            "count_haha",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='wow')"
            ),
            "count_wow",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='sad')"
            ),
            "count_sad",
          ],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM PostReactions WHERE post_id = Post.post_id AND reaction_type='angry')"
            ),
            "count_angry",
          ],
        ],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "full_name", "avatar_url"],
            include: [{ model: Role, as: "role", attributes: ["name"] }],
          },
        ],
      });

      const posts = rows.map((item) => {
        const p = item.get({ plain: true });

        return {
          post_id: p.post_id,
          content: p.content,
          created_at: p.created_at,
          user_id: p.user?.user_id,
          full_name: p.user?.full_name,
          avatar_url: p.user?.avatar_url,
          role_name: p.user?.role?.name,
          like_count: Number(p.like_count),
          comment_count: Number(p.comment_count),
          current_reaction: p.current_reaction,
          reaction_stats: {
            like: Number(p.count_like),
            love: Number(p.count_love),
            haha: Number(p.count_haha),
            wow: Number(p.count_wow),
            sad: Number(p.count_sad),
            angry: Number(p.count_angry),
          },
        };
      });

      return {
        posts,
        pagination: {
          total: count,
          page: Number(page),
          limit: numLimit,
          totalPages: Math.ceil(count / numLimit),
        },
      };
    } catch (error) {
      throw new Error(`Service GetByEventId Error: ${error.message}`);
    }
  }

  static async getById(post_id) {
    try {
      const post = await Post.findOne({
        where: { post_id },
        include: [
          {
            model: Event,
            as: "event",
            attributes: ["manager_id", "is_deleted", "approval_status"],
          },
        ],
      });

      if (!post) return null;

      const p = post.get({ plain: true });

      return {
        ...p,
        event_manager_id: p.event?.manager_id,
        event_is_deleted: p.event?.is_deleted,
        event_status: p.event?.approval_status,
      };
    } catch (error) {
      throw new Error(`Service GetById Error: ${error.message}`);
    }
  }

  static async delete(post_id) {
    try {
      const count = await Post.destroy({ where: { post_id } });
      return count > 0;
    } catch (error) {
      throw new Error(`Service Delete Error: ${error.message}`);
    }
  }
}

export default PostService;