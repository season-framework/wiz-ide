def list():
    apps = wiz.src.app.list()
    wiz.response.status(200, apps)