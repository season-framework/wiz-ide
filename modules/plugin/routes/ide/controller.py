import os
import season

plugin_id = wiz.request.segment.plugin_id

allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
for c in plugin_id:
    if c not in allowed:
        wiz.response.redirect("/plugin")

fs = season.util.os.FileSystem(os.path.join(season.path.project, "plugin", "modules", plugin_id))
isnew = False
if fs.exists() == False:
    isnew = True

wiz.response.render("ide", plugin_id=plugin_id, isnew=isnew)