import os
import season

plugin_id = wiz.request.segment.plugin_id
fs = season.util.os.FileSystem(os.path.join(season.path.project, "plugin", "modules", plugin_id))
if fs.exists() == False:
    wiz.response.abort(404)

wiz.response.render("ide", plugin_id=plugin_id)