import os
import json
import season

def list():
    mode = wiz.request.query("mode", 'app')
    if mode == 'app':
        apps = wiz.src.app.list()
    elif mode == 'route':
        apps = wiz.src.route.list()
    else:
        apps = []
    wiz.response.status(200, apps)

def load():
    try:
        mode = wiz.request.query("mode", 'app')
        if mode == 'app':
            app_id = wiz.request.query("id", True)
            app = wiz.src.app(app_id)
            app = app.data()
        elif mode == 'route':
            app_id = wiz.request.query("id", True)
            app = wiz.src.route(app_id)
            app = app.data()
        else:
            app = None
    except:
        app = None

    if app is None:
        wiz.response.status(404)

    wiz.response.status(200, app)

def app_create():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)

    basepath = os.path.join(wiz.branchpath(), "apps")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id):
        wiz.response.status(401, "ID already used")
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in app_id:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")
    app = wiz.src.app(app_id)
    try:
        app.update(data)
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def app_rename():
    app_id = wiz.request.query("app_id", True)
    rename = wiz.request.query("rename", True)
    if len(rename) < 4 or len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    basepath = os.path.join(wiz.branchpath(), "apps")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id) == False:
        wiz.response.status(404, "App Not Found")
    if fs.exists(rename):
        wiz.response.status(401, "Rename ID already used")
    
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in rename:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")

    fs.rename(app_id, rename)
    wiz.response.status(200)

def app_update():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)
    app = wiz.src.app(app_id)
    try:
        app.update(data)
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def app_delete():
    app_id = wiz.request.query("app_id", True)
    basepath = os.path.join(wiz.branchpath(), "apps")
    fs = season.util.os.FileSystem(basepath)
    if len(app_id) > 3 and fs.exists(app_id):
        fs.delete(app_id)
    wiz.response.status(200)

# route edit
def route_create():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)

    basepath = os.path.join(wiz.branchpath(), "routes")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id):
        wiz.response.status(401, "ID already used")
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in app_id:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")
    app = wiz.src.route(app_id)
    try:
        app.update(data)
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def route_rename():
    app_id = wiz.request.query("app_id", True)
    rename = wiz.request.query("rename", True)
    if len(rename) < 4 or len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    basepath = os.path.join(wiz.branchpath(), "routes")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id) == False:
        wiz.response.status(404, "App Not Found")
    if fs.exists(rename):
        wiz.response.status(401, "Rename ID already used")
    
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in rename:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")

    fs.rename(app_id, rename)
    wiz.response.status(200)

def route_update():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 4:
        wiz.response.status(404, "APP ID must be at least 4 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)
    app = wiz.src.route(app_id)
    try:
        app.update(data)
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def route_delete():
    app_id = wiz.request.query("app_id", True)
    basepath = os.path.join(wiz.branchpath(), "routes")
    fs = season.util.os.FileSystem(basepath)
    if len(app_id) > 3 and fs.exists(app_id):
        fs.delete(app_id)
    wiz.response.status(200)