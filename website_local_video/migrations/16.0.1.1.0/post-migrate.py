"""Secure videos embedded by versions older than 16.0.1.1.0."""

import re

from odoo import SUPERUSER_ID, api


VIDEO_TYPES = {
    "video/mp4",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
}
LEGACY_DESCRIPTIONS = {
    "Video uploaded from the Website Builder",
    "Vídeo subido desde el editor del sitio web",
}
ATTACHMENT_ID_RE = re.compile(
    r"\bdata-video-attachment-id=(?P<quote>['\"])(?P<id>\d+)(?P=quote)"
)
TOKEN_RE = re.compile(
    r"\s+data-video-access-token=(?P<quote>['\"])[^'\"]*(?P=quote)"
)


def _secure_arch(env, arch, token_by_attachment):
    """Add an access token to every valid local-video snippet in ``arch``."""

    def replace(match):
        attachment_id = int(match.group("id"))
        attachment = env["ir.attachment"].browse(attachment_id).exists()
        if (
            not attachment
            or attachment.type != "binary"
            or attachment.res_model != "website"
            or attachment.mimetype not in VIDEO_TYPES
        ):
            return match.group(0)

        token = token_by_attachment.get(attachment_id)
        if not token:
            token = attachment.generate_access_token()[0]
            token_by_attachment[attachment_id] = token
        if attachment.public:
            attachment.write({"public": False})

        return f'{match.group(0)} data-video-access-token="{token}"'

    # Remove a token first so rerunning an interrupted migration is harmless.
    return ATTACHMENT_ID_RE.sub(replace, TOKEN_RE.sub("", arch))


def migrate(cr, _version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    # Also close access to orphaned/replaced videos which no longer occur in
    # any page architecture.  The description was the module's only marker in
    # the previous release (Spanish is the only bundled translation).
    legacy_attachments = env["ir.attachment"].search(
        [
            ("public", "=", True),
            ("res_model", "=", "website"),
            ("mimetype", "in", tuple(VIDEO_TYPES)),
            ("description", "in", tuple(LEGACY_DESCRIPTIONS)),
        ]
    )
    legacy_attachments.write({"public": False})

    views = (
        env["ir.ui.view"]
        .with_context(active_test=False)
        .search([("arch_db", "like", "data-video-attachment-id")])
    )
    token_by_attachment = {}
    for view in views:
        secured_arch = _secure_arch(env, view.arch_db, token_by_attachment)
        if secured_arch != view.arch_db:
            view.write({"arch_db": secured_arch})
