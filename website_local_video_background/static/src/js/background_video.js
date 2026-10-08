/** @odoo-module **/

import publicWidget from "web.public.widget";
import "website.content.snippets.animation";

const BackgroundVideo = publicWidget.registry.backgroundVideo;

/**
 * Teach Odoo's standard background-video widget how to render a local file.
 *
 * Keeping the standard `o_background_video` class is important: the Website
 * Builder uses it to order background filters and shapes, and to expose the
 * normal background-video toggle.  Only the generated player differs from
 * Odoo's iframe-based implementation.
 */
BackgroundVideo.include({
    start() {
        const source = this._getLocalBackgroundVideoSource();
        if (!source) {
            return this._super(...arguments);
        }

        this._localBackgroundVideo = true;
        this._appendLocalBackgroundVideo(source);
        return Promise.resolve();
    },

    destroy() {
        if (!this._localBackgroundVideo) {
            return this._super(...arguments);
        }
        if (this.$bgVideoContainer) {
            this.$bgVideoContainer.remove();
        }
        return publicWidget.Widget.prototype.destroy.apply(this, arguments);
    },

    _getLocalBackgroundVideoSource() {
        const attachmentId = this.el.dataset.bgVideoLocalAttachmentId;
        const accessToken = this.el.dataset.bgVideoLocalAccessToken;
        if (!/^\d+$/.test(attachmentId || "") || !accessToken) {
            return "";
        }
        return (
            `/website_local_video/content/${attachmentId}`
            + `?access_token=${encodeURIComponent(accessToken)}`
        );
    },

    _appendLocalBackgroundVideo(source) {
        const oldContainer = this.el.querySelector(":scope > .o_bg_video_container");
        const container = document.createElement("div");
        container.className = "o_bg_video_container o_local_bg_video_container";

        const loading = document.createElement("div");
        loading.className = (
            "o_bg_video_loading d-flex justify-content-center "
            + "align-items-center text-primary"
        );
        const spinner = document.createElement("div");
        spinner.className = "spinner-border";
        spinner.setAttribute("role", "status");
        spinner.setAttribute("aria-label", "Loading");
        loading.appendChild(spinner);

        const video = document.createElement("video");
        video.className = "o_local_bg_video_player";
        video.autoplay = true;
        video.defaultMuted = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-hidden", "true");
        video.setAttribute("tabindex", "-1");
        video.src = source;

        const finishLoading = () => loading.remove();
        video.addEventListener("loadeddata", finishLoading, {once: true});
        video.addEventListener("error", finishLoading, {once: true});

        container.append(loading, video);
        this.el.prepend(container);
        if (oldContainer) {
            oldContainer.remove();
        }
        this.$bgVideoContainer = $(container);

        // Muted inline video is eligible for autoplay in modern browsers.
        // Failure is harmless: the first frame remains as the background.
        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch(() => {});
        }
    },
});

export default BackgroundVideo;
