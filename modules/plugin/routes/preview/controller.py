plugin_id = wiz.request.segment.plugin_id
app_id = wiz.request.segment.app_id

plugin = wiz.load(plugin_id)
app = plugin.src.plugin.app(app_id)
data = app.data(False)

view = plugin.render(app_id)

try:
    theme = data['package']['theme']
    theme = theme.split("/")
    themename = theme[0]
    layoutname = theme[1]

    kwargs = wiz.response.data.get()
    plugin.response.data.set(**kwargs)

    fs = season.util.os.FileSystem(season.path.lib)
    wizjs = fs.read("wiz.js")
    wizurl = wiz.server.config.server.wiz_url
    if wizurl[-1] == "/": wizurl = wizurl[:-1]

    wizjs = wizjs.replace("{$BASEPATH$}", wizurl + "/plugin_api/" + plugin.id).replace("{$URL$}", wizurl).replace("{$SOCKETBASEPATH$}", wizurl + "/plugin/" + plugin.id)
    view = f'<script type="text/javascript">{wizjs}</script>\n{view}'
    view = plugin.theme(themename).layout(layoutname).view('layout.pug', view)
except Exception as e:
    pass

wiz.response.send(view, 'text/html')