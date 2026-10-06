{
    "name": "Website Local Video",
    "summary": "Upload and embed local videos in the Website Builder",
    "version": "16.0.1.1.0",
    "category": "Website/Website",
    "author": "ZV",
    "license": "LGPL-3",
    "depends": ["website"],
    "data": [
        "views/snippets/s_local_video.xml",
        "views/snippets/snippets.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "website_local_video/static/src/js/s_local_video.js",
            "website_local_video/static/src/scss/s_local_video.scss",
        ],
        "website.assets_wysiwyg": [
            "website_local_video/static/src/js/s_local_video_options.js",
        ],
    },
    "images": ["static/description/banner.svg"],
    "installable": True,
    "application": False,
}
