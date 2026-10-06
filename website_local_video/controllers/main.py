"""HTTP endpoints used by the local-video Website Builder block."""

import logging
import mimetypes
import os

from werkzeug.utils import secure_filename

from odoo import _, http
from odoo.http import request


_logger = logging.getLogger(__name__)

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
}
DEFAULT_MAX_FILE_SIZE_MB = 100
MAX_CONFIGURABLE_FILE_SIZE_MB = 1024


class WebsiteLocalVideoController(http.Controller):
    """Accept editor uploads and store them as website attachments."""

    @http.route(
        "/website_local_video/upload",
        type="http",
        auth="user",
        methods=["POST"],
        csrf=True,
        website=True,
    )
    def upload_video(self, ufile=None, **_kwargs):
        """Validate and persist one video uploaded by a website editor."""
        if not request.env.user.has_group("website.group_website_restricted_editor"):
            return self._json_response(
                {"error": _("You do not have permission to edit this website.")},
                status=403,
            )

        if not ufile or not getattr(ufile, "filename", None):
            return self._json_response(
                {"error": _("Select a video file to upload.")}, status=400
            )

        filename = secure_filename(os.path.basename(ufile.filename)) or "video"
        uploaded_mimetype = (getattr(ufile, "mimetype", "") or "").lower()
        guessed_mimetype = (mimetypes.guess_type(filename)[0] or "").lower()
        mimetype = (
            uploaded_mimetype
            if uploaded_mimetype in ALLOWED_VIDEO_TYPES
            else guessed_mimetype
        )
        if mimetype not in ALLOWED_VIDEO_TYPES:
            return self._json_response(
                {
                    "error": _(
                        "Unsupported video format. Use MP4, WebM, OGG, MOV, or M4V."
                    )
                },
                status=400,
            )

        max_size_mb = self._get_max_file_size_mb()
        max_size = max_size_mb * 1024 * 1024
        content = ufile.stream.read(max_size + 1)
        if len(content) > max_size:
            return self._json_response(
                {
                    "error": _("The video exceeds the allowed limit of %s MB.")
                    % max_size_mb
                },
                status=413,
            )
        if not content:
            return self._json_response(
                {"error": _("The selected video is empty.")}, status=400
            )

        website = request.website

        try:
            attachment = (
                request.env["ir.attachment"]
                .sudo()
                .create(
                    {
                        "name": filename,
                        "raw": content,
                        "mimetype": mimetype,
                        "public": True,
                        "res_model": "website",
                        "res_id": website.id,
                        "description": _("Video uploaded from the Website Builder"),
                    }
                )
            )
        except Exception:
            _logger.exception("Could not save a video uploaded from the website editor")
            return self._json_response(
                {"error": _("Odoo could not save the video.")}, status=500
            )

        return self._json_response(
            {
                "id": attachment.id,
                "name": attachment.name,
                "mimetype": attachment.mimetype,
                "url": f"/web/content/{attachment.id}",
            }
        )

    @staticmethod
    def _get_max_file_size_mb():
        value = (
            request.env["ir.config_parameter"]
            .sudo()
            .get_param(
                "website_local_video.max_file_size_mb", DEFAULT_MAX_FILE_SIZE_MB
            )
        )
        try:
            value = int(value)
        except (TypeError, ValueError):
            value = DEFAULT_MAX_FILE_SIZE_MB
        return min(max(value, 1), MAX_CONFIGURABLE_FILE_SIZE_MB)

    @staticmethod
    def _json_response(payload, status=200):
        return request.make_json_response(payload, status=status)
