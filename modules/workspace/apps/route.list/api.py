def list():
    apps = wiz.src.route.list()
    wiz.response.status(200, apps)
    # app = wiz.src.app.load('modal.message')