import { ajax } from "discourse/lib/ajax";
import RestModel from "discourse/models/rest";
import Topic from "discourse/models/topic";
import User from "discourse/models/user";
import Post from "discourse/models/post";
import Category from "discourse/models/category";
import EmberObject from "@ember/object";

const CustomReaction = RestModel.extend({
  init() {
    this._super(...arguments);

    this.__type = "discourse-reactions-custom-reaction";
  },
});

CustomReaction.reopenClass({
  toggle(postId, reactionId) {
    return ajax(
      `/discourse-reactions/posts/${postId}/custom-reactions/${reactionId}/toggle.json`,
      { type: "PUT" }
    );
  },

  findReactions(url, username, opts) {
    opts = opts || {};
    const data = { username };

    if (opts.beforeReactionUserId) {
      data.before_reaction_user_id = opts.beforeReactionUserId;
    }

    if (opts.actingUsername) {
      data.acting_username = opts.actingUsername;
    }

    return ajax(`/discourse-reactions/posts/${url}.json`, {
      data,
    }).then((reactions) => {
      return reactions.map((reaction) => {
        reaction.user = User.create(reaction.user);
        reaction.topic = Topic.create(reaction.post.topic);
        reaction.post_user = User.create(reaction.post.user);
        reaction.category = Category.findById(reaction.post.category_id);
        reaction.post = Post.create(reaction.post);
        return EmberObject.create(reaction);
      });
    });
  },

  findReactionUsers(postId, opts) {
    opts = opts || {};
    const data = {};

    if (opts.reactionValue) {
      data.reaction_value = opts.reactionValue;
    }

    return ajax(`/discourse-reactions/posts/${postId}/reactions-users.json`, {
      data,
    });
  },
});

export default CustomReaction;
