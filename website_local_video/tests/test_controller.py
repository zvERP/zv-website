from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestLocalVideoAccess(HttpCase):
    def setUp(self):
        super().setUp()
        self.website = self.env.ref("website.default_website")
        self.video = (
            self.env["ir.attachment"]
            .sudo()
            .create(
                {
                    "name": "public-page-video.mp4",
                    "raw": b"not-a-real-video-but-enough-for-streaming",
                    "mimetype": "video/mp4",
                    "public": False,
                    "res_model": "website",
                    "res_id": self.website.id,
                }
            )
        )
        self.token = self.video.generate_access_token()[0]

    def _video_url(self, attachment=None, token=None):
        attachment = attachment or self.video
        token = token or self.token
        return (
            f"/website_local_video/content/{attachment.id}"
            f"?access_token={token}"
        )

    def test_valid_token_streams_video(self):
        response = self.url_open(self._video_url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "video/mp4")

    def test_missing_or_wrong_token_is_not_found(self):
        without_token = self.url_open(
            f"/website_local_video/content/{self.video.id}"
        )
        wrong_token = self.url_open(self._video_url(token="not-the-token"))
        self.assertEqual(without_token.status_code, 404)
        self.assertEqual(wrong_token.status_code, 404)

    def test_token_cannot_be_reused_with_another_id(self):
        other = (
            self.env["ir.attachment"]
            .sudo()
            .create(
                {
                    "name": "internal.pdf",
                    "raw": b"internal",
                    "mimetype": "application/pdf",
                    "public": False,
                    "res_model": "website",
                    "res_id": self.website.id,
                }
            )
        )
        response = self.url_open(self._video_url(attachment=other))
        self.assertEqual(response.status_code, 404)

    def test_correct_token_does_not_expose_an_unrelated_attachment(self):
        internal = (
            self.env["ir.attachment"]
            .sudo()
            .create(
                {
                    "name": "internal.pdf",
                    "raw": b"internal",
                    "mimetype": "application/pdf",
                    "public": False,
                    "res_model": "website",
                    "res_id": self.website.id,
                }
            )
        )
        internal_token = internal.generate_access_token()[0]
        response = self.url_open(
            self._video_url(attachment=internal, token=internal_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_generic_content_route_does_not_expose_video(self):
        response = self.url_open(f"/web/content/{self.video.id}")
        self.assertEqual(response.status_code, 404)
