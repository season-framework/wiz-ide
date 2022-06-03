def list():
    apps = wiz.src.app.list()
    wiz.response.status(200, apps)

def load():
    try:
        app_id = wiz.request.query("id", True)
        app = wiz.src.app(app_id)
        app = app.data()
    except:
        app = None

    if app is None:
        wiz.response.status(404)

    wiz.response.status(200, app)
