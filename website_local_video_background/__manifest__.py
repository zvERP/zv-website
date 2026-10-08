{
    "name": "Website Local Video Background",
    "summary": "Use uploaded videos as Website Builder backgrounds",
    "version": "16.0.1.0.0",
    "category": "Website/Website",
    "author": "ZV",
    "license": "LGPL-3",
    "depends": ["website_local_video"],
    "data": [
        "views/snippet_options.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "website_local_video_background/static/src/js/background_video.js",
            "website_local_video_background/static/src/scss/background_video.scss",
        ],
        "website.assets_wysiwyg": [
            "website_local_video_background/static/src/js/background_video_options.js",
        ],
    },
    "installable": True,
    "application": False,
}
