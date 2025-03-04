import { withPluginApi } from "discourse/lib/plugin-api";
import { replaceIcon } from "discourse-common/lib/icon-library";
import { emojiUrlFor } from "discourse/lib/text";

const PLUGIN_ID = "discourse-reactions";

replaceIcon("notification.reaction", "bell");

function initializeDiscourseReactions(api) {
  api.removePostMenuButton("like");

  api.addKeyboardShortcut("l", null, {
    click: ".topic-post.selected .discourse-reactions-reaction-button",
  });

  api.decorateWidget("post-menu:before-extra-controls", (dec) => {
    const post = dec.getModel();
    if (!post || post.deleted_at) {
      return;
    }

    return dec.attach("discourse-reactions-actions", {
      post,
    });
  });

  api.modifyClass("component:scrolling-post-stream", {
    pluginId: PLUGIN_ID,

    didInsertElement() {
      this._super(...arguments);

      const topicId = this?.posts?.firstObject?.topic_id;
      if (topicId) {
        this.messageBus.subscribe(`/topic/${topicId}/reactions`, (data) => {
          this.dirtyKeys.keyDirty(
            `discourse-reactions-counter-${data.post_id}`,
            {
              onRefresh: "reactionsChanged",
              refreshArg: data,
            }
          );
          this._refresh({ id: data.post_id });
        });
      }
    },
  });

  api.modifyClass("controller:topic", {
    pluginId: PLUGIN_ID,

    unsubscribe() {
      this._super(...arguments);

      const topicId = this.model.id;
      topicId && this.messageBus.unsubscribe(`/topic/${topicId}/reactions`);
    },
  });

  api.decorateWidget("post-menu:extra-post-controls", (dec) => {
    if (dec.widget.site.mobileView) {
      return;
    }

    const mainReaction =
      dec.widget.siteSettings.discourse_reactions_reaction_for_like;
    const post = dec.getModel();

    if (!post || post.deleted_at) {
      return;
    }

    if (
      post.reactions &&
      post.reactions.length === 1 &&
      post.reactions[0].id === mainReaction
    ) {
      return;
    }

    return dec.attach("discourse-reactions-counter", {
      post,
    });
  });

  api.modifyClass("component:emoji-value-list", {
    pluginId: PLUGIN_ID,

    didReceiveAttrs() {
      this._super(...arguments);

      if (this.setting.setting !== "discourse_reactions_enabled_reactions") {
        return;
      }

      let defaultValue = this.values.includes(
        this.siteSettings.discourse_reactions_reaction_for_like
      );

      if (!defaultValue) {
        this.collection.unshiftObject({
          emojiUrl: emojiUrlFor(
            this.siteSettings.discourse_reactions_reaction_for_like
          ),
          isEditable: false,
          isEditing: false,
          value: this.siteSettings.discourse_reactions_reaction_for_like,
        });
      } else {
        const mainEmoji = this.collection.findBy(
          "value",
          this.siteSettings.discourse_reactions_reaction_for_like
        );

        if (mainEmoji) {
          mainEmoji.isEditable = false;
        }
      }
    },
  });
}

export default {
  name: "discourse-reactions",

  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (siteSettings.discourse_reactions_enabled) {
      withPluginApi("0.10.1", initializeDiscourseReactions);
    }
  },
};
