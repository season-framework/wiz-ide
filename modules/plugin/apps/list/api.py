import os
import season

def list():
    fs = season.util.os.FileSystem(os.path.join(season.path.project, "plugin", "modules"))
    rows = fs.list()
    res = []
    for item in rows:
        plugin = fs.read.json(os.path.join(item, "plugin.json"), {"name": item})
        plugin['id'] = item
        res.append(plugin)
    wiz.response.status(200, res)