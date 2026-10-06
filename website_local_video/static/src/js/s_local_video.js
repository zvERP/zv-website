/** @odoo-module **/

import publicWidget from "web.public.widget";

const LocalVideo = publicWidget.Widget.extend({
    selector: ".s_local_video",

    start() {
        const target = this.el;
        const player = target.querySelector(".o_local_video_player");
        const placeholder = target.querySelector(".o_local_video_placeholder");
        if (player) {
            const controls = target.classList.contains("o_local_video_controls");
            const autoplay = target.classList.contains("o_local_video_autoplay");
            const loop = target.classList.contains("o_local_video_loop");
            const muted = target.classList.contains("o_local_video_muted");

            player.controls = controls;
            player.autoplay = autoplay;
            player.loop = loop;
            player.defaultMuted = muted;
            player.muted = muted || autoplay;

            const attachmentId = Number.parseInt(target.dataset.videoAttachmentId, 10);
            if (attachmentId > 0) {
                player.setAttribute("src", `/web/content/${attachmentId}`);
                if (placeholder) {
                    placeholder.classList.add("d-none");
                }
            }
        }
        return this._super(...arguments);
    },
});

publicWidget.registry.LocalVideo = LocalVideo;

export default LocalVideo;
