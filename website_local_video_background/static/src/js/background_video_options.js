/** @odoo-module **/

import ajax from "web.ajax";
import core from "web.core";
import Dialog from "web.Dialog";
import options from "web_editor.snippets.options";
import "website.editor.snippets.options";

const _t = core._t;
const BackgroundVideo = options.registry.BackgroundVideo;
const ACCEPTED_VIDEO_TYPES = (
    "video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,"
    + ".mp4,.webm,.ogv,.ogg,.mov,.m4v"
);

BackgroundVideo.include({
    uploadLocalBackgroundVideo(previewMode) {
        if (!previewMode) {
            this._openLocalBackgroundVideoPicker();
        }
    },

    cleanForSave() {
        this.$target.removeClass("o_local_bg_video_uploading");
        return this._super(...arguments);
    },

    /**
     * Selecting or removing an iframe video must also discard the local-video
     * marker. Preview changes keep it so cancelling the media dialog restores
     * the previous local background.
     */
    _setBgVideo(previewMode, value) {
        if (previewMode === false) {
            this._clearLocalBackgroundVideoData();
        }
        return this._super(...arguments);
    },

    _openLocalBackgroundVideoPicker() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ACCEPTED_VIDEO_TYPES;
        input.className = "d-none";
        input.addEventListener("change", async () => {
            const file = input.files && input.files[0];
            input.remove();
            if (file) {
                await this._uploadLocalBackgroundVideo(file);
            }
        }, {once: true});
        document.body.appendChild(input);
        input.click();
        window.addEventListener("focus", () => {
            window.setTimeout(() => input.remove(), 0);
        }, {once: true});
    },

    async _uploadLocalBackgroundVideo(file) {
        this.$target.addClass("o_local_bg_video_uploading");
        try {
            const result = await ajax.post("/website_local_video/upload", {ufile: file});
            if (!result || result.error) {
                throw new Error(
                    result && result.error
                    || _t("The server did not return a valid response."),
                );
            }
            await this._setLocalBackgroundVideo(result);
        } catch (error) {
            const message = error && error.responseJSON && error.responseJSON.error
                || error && error.message
                || _t("The video could not be uploaded.");
            Dialog.alert(this, message, {title: _t("Video upload failed")});
        } finally {
            this.$target.removeClass("o_local_bg_video_uploading");
        }
    },

    async _setLocalBackgroundVideo(result) {
        const target = this.$target[0];
        delete target.dataset.bgVideoSrc;
        target.dataset.bgVideoLocalAttachmentId = result.id;
        target.dataset.bgVideoLocalAccessToken = result.access_token;
        target.dataset.bgVideoLocalFilename = result.name;
        target.classList.add("o_background_video");
        this.videoSrc = "";
        await this._refreshPublicWidgets();
    },

    _clearLocalBackgroundVideoData() {
        const target = this.$target[0];
        delete target.dataset.bgVideoLocalAttachmentId;
        delete target.dataset.bgVideoLocalAccessToken;
        delete target.dataset.bgVideoLocalFilename;
    },
});

export default BackgroundVideo;
