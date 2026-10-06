/** @odoo-module **/

import options from "web_editor.snippets.options";
import ajax from "web.ajax";
import core from "web.core";
import Dialog from "web.Dialog";

const _t = core._t;

const BOOLEAN_OPTIONS = {
    toggleControls: "o_local_video_controls",
    toggleAutoplay: "o_local_video_autoplay",
    toggleLoop: "o_local_video_loop",
    toggleMuted: "o_local_video_muted",
};

const LocalVideo = options.Class.extend({
    /**
     * Open the picker immediately after dropping the block. The upload button
     * remains available when the browser blocks this automatic picker or when
     * the editor cancels the selection.
     */
    onBuilt() {
        this._openFilePicker();
    },

    cleanForSave() {
        this.$target.removeClass("o_local_video_uploading");
    },

    uploadVideo(previewMode) {
        if (!previewMode) {
            this._openFilePicker();
        }
    },

    toggleControls(previewMode, widgetValue) {
        this._setPlayerOption("o_local_video_controls", Boolean(widgetValue));
    },

    toggleAutoplay(previewMode, widgetValue) {
        this._setPlayerOption("o_local_video_autoplay", Boolean(widgetValue));
    },

    toggleLoop(previewMode, widgetValue) {
        this._setPlayerOption("o_local_video_loop", Boolean(widgetValue));
    },

    toggleMuted(previewMode, widgetValue) {
        this._setPlayerOption("o_local_video_muted", Boolean(widgetValue));
    },

    _computeWidgetState(methodName, params) {
        const optionClass = BOOLEAN_OPTIONS[methodName];
        if (optionClass) {
            return this.$target[0].classList.contains(optionClass) ? "true" : "";
        }
        return this._super(...arguments);
    },

    _setPlayerOption(optionClass, enabled) {
        this.$target[0].classList.toggle(optionClass, enabled);
        this._syncPlayerOptions();
    },

    _syncPlayerOptions() {
        const target = this.$target[0];
        const player = this.$target[0].querySelector(".o_local_video_player");
        if (!player) {
            return;
        }
        const controls = target.classList.contains("o_local_video_controls");
        const autoplay = target.classList.contains("o_local_video_autoplay");
        const loop = target.classList.contains("o_local_video_loop");
        const muted = target.classList.contains("o_local_video_muted");

        player.controls = controls;
        player.autoplay = autoplay;
        player.loop = loop;
        player.defaultMuted = muted;
        player.muted = muted || autoplay;
    },

    _openFilePicker() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,.mp4,.webm,.ogv,.ogg,.mov,.m4v";
        input.className = "d-none";
        input.addEventListener("change", async () => {
            const file = input.files && input.files[0];
            input.remove();
            if (file) {
                await this._uploadFile(file);
            }
        }, { once: true });
        document.body.appendChild(input);
        input.click();
        window.addEventListener("focus", () => {
            window.setTimeout(() => input.remove(), 0);
        }, { once: true });
    },

    async _uploadFile(file) {
        this.$target.addClass("o_local_video_uploading");
        try {
            const result = await ajax.post("/website_local_video/upload", { ufile: file });
            if (!result || result.error) {
                throw new Error(result && result.error || _t("The server did not return a valid response."));
            }
            this._setVideo(result);
        } catch (error) {
            const message = error && error.responseJSON && error.responseJSON.error
                || error && error.message
                || _t("The video could not be uploaded.");
            Dialog.alert(this, message, { title: _t("Video upload failed") });
        } finally {
            this.$target.removeClass("o_local_video_uploading");
        }
    },

    _setVideo(result) {
        const target = this.$target[0];
        const player = target.querySelector(".o_local_video_player");
        const placeholder = target.querySelector(".o_local_video_placeholder");
        if (!player) {
            return;
        }

        player.pause();
        player.setAttribute("src", result.url);
        this._syncPlayerOptions();
        player.load();
        target.dataset.videoAttachmentId = result.id;
        target.dataset.videoAccessToken = result.access_token;
        target.dataset.videoFilename = result.name;
        if (placeholder) {
            placeholder.classList.add("d-none");
        }
    },
});

options.registry.LocalVideo = LocalVideo;

export default LocalVideo;
