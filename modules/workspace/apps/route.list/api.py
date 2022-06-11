def list():
    apps = wiz.src.route.list()
    wiz.response.status(200, apps)