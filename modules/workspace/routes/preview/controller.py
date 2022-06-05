mode = wiz.request.segment.mode
app_id = wiz.request.segment.app_id

app = wiz.src.app(app_id)
data = app.data(False)

view = wiz.server.wiz.render(app_id)

try:
    theme = data['package']['theme']
    theme = theme.split("/")
    themename = theme[0]
    layoutname = theme[1]

    fs = season.util.os.FileSystem(season.path.lib)
    wizjs = fs.read("wiz.js")
    wizurl = wiz.server.config.server.wiz_url
    if wizurl[-1] == "/": wizurl = wizurl[:-1]
    wizjs = wizjs.replace("{$BASEPATH$}", wizurl + "/api")
    view = f'<script type="text/javascript">{wizjs}</script>\n{view}'
    view = wiz.server.wiz.theme(themename).layout(layoutname).view('layout.pug', view)
except Exception as e:
    pass

wiz.response.send(view, 'text/html')