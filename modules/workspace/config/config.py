from season import stdClass

config = stdClass()
config.menu = [
    {"type": "header", "title": "Workspace"},
    {"title": "Route", "url": "/routes", "icon": "fa-solid fa-link"},
    {"title": "Apps", "url": "/apps", "icon": "fa-solid fa-cubes"},
    {"title": "Controller", "url": "/browser/controller", "icon": "fa-solid fa-filter"},
    {"title": "Model", "url": "/browser/model", "icon": "fa-solid fa-database"},
    {"title": "Theme", "url": "/browser/theme", "icon": "fa-solid fa-display"},
    {"title": "Resources", "url": "/browser/resources", "icon": "fa-solid fa-folder-tree"},
    {"title": "Config", "url": "/browser/config", "icon": "fa-solid fa-gear"}
]