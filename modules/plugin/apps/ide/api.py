import season
import json
import os
import zipfile
import tempfile
import time
import datetime
import shutil

plugin_id = wiz.request.query('plugin_id', True)
instance = wiz.load(plugin_id)
pluginfs = season.util.os.FileSystem(os.path.join(season.path.project, "plugin", "modules", plugin_id))

def info():
    try:
        res = pluginfs.read.json("plugin.json", dict())
        res['id'] = plugin_id
    except:
        res = dict()
        res['id'] = plugin_id
    wiz.response.status(200, res)

def info_delete():
    if plugin_id in ['workspace', 'branch', 'plugin', 'setting']:
        wiz.response.status(500, 'not allowed to delete')
    pluginfs.delete()
    wiz.response.status(200)

def info_update():
    try:
        data = wiz.request.query("data", "{}")
        data = json.loads(data)
        res = pluginfs.write.json("plugin.json", data)
    except:
        wiz.response.status(400)
    wiz.response.status(200)

def themes():
    fs = season.util.os.FileSystem(os.path.join(season.path.project, "plugin", "themes"))
    themes = fs.list()
    res = [""]
    for filename in themes:
        layouts = fs.files(os.path.join(filename, 'layout'))
        for layout in layouts:
            res.append(filename + "/" + layout)
    wiz.response.status(200, res)

def controllers():
    ctrls = [""]
    controllers = pluginfs.files(os.path.join("interfaces", "controller"), recursive=True)
    for ctrl in controllers:
        ctrl = ctrl.replace(os.path.join("interfaces", "controller") + "/", "")
        if branchfs.isfile(os.path.join("interfaces", "controller", ctrl)):
            ctrl = os.path.splitext(ctrl)[0]
            ctrls.append(ctrl)
    wiz.response.status(200, ctrls)

def clean():
    wiz.server.config.reload()
    season.cache = season.stdClass()
    fs = season.util.os.FileSystem(os.path.join(season.path.project, 'cache'))
    fs.remove()
    wiz.response.status(200)

def list():
    mode = wiz.request.query("mode", 'app')
    if mode == 'app':
        res = instance.src.plugin.app.list()
    elif mode == 'route':
        res = instance.src.plugin.route.list()
    else:
        path = wiz.request.query("path", "")
        while len(path) > 0 and path[0] == "/":
            path = path[1:]
        if mode in ['controller', 'model']:
            mode = os.path.join('interfaces', mode)

        basepath = os.path.join(instance.basepath(), mode)
        fs = season.util.os.FileSystem(basepath)
        res = fs.list(path)
        for i in range(len(res)):
            obj = dict()
            obj['name'] = res[i]
            obj['parent'] = path
            obj['path'] = os.path.join(path, res[i])
            obj['type'] = 'folder'
            filepath = fs.abspath(os.path.join(path, res[i]))
            if fs.isfile(os.path.join(path, res[i])):
                obj['type'] = 'file'
                obj['size'] = os.path.getsize(filepath)
            obj['ctime'] = os.path.getctime(filepath)
            res[i] = obj
    wiz.response.status(200, res)

def load():
    try:
        mode = wiz.request.query("mode", 'app')
        if mode == 'app':
            app_id = wiz.request.query("id", True)
            app = instance.src.plugin.app(app_id)
            res = app.data()
        elif mode == 'route':
            app_id = wiz.request.query("id", True)
            app = instance.src.plugin.route(app_id)
            res = app.data()
        else:
            path = wiz.request.query("path", True)
            while len(path) > 0 and path[0] == "/":
                path = path[1:]
            if mode in ['controller', 'model']:
                mode = os.path.join('interfaces', mode)
            basepath = os.path.join(instance.basepath(), mode)
            fs = season.util.os.FileSystem(basepath)

            res = None
            extmap = wiz.server.config.wiz.file_support
            ext =  os.path.splitext(path)[1].lower()
            if ext in extmap:
                exttype = extmap[ext]
                if exttype == 'image':
                    res = {"type": "image", "data": path}
                if exttype.split("/")[0] == 'code':
                    codelang = exttype.split("/")[1]
                    res = {"type": "code", "lang": codelang, "data": fs.read(path)}
    except:
        res = None

    if res is None:
        wiz.response.status(404)

    wiz.response.status(200, res)

def app_create():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)

    basepath = os.path.join(instance.basepath(), "apps")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id):
        wiz.response.status(401, "ID already used")
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in app_id:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")
    app = instance.src.plugin.app(app_id)
    try:
        app.update(data)
        app.manager.clean()
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def app_rename():
    app_id = wiz.request.query("app_id", True)
    rename = wiz.request.query("rename", True)
    if len(rename) < 3 or len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    basepath = os.path.join(instance.basepath(), "apps")
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
    if len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)
    app = instance.src.plugin.app(app_id)
    try:
        app.update(data)
        app.manager.clean()
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def app_delete():
    app_id = wiz.request.query("app_id", True)
    basepath = os.path.join(instance.basepath(), "apps")
    fs = season.util.os.FileSystem(basepath)
    if len(app_id) >= 3 and fs.exists(app_id):
        fs.delete(app_id)
    wiz.response.status(200)

# route edit
def route_create():
    app_id = wiz.request.query("app_id", True)
    if len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)

    basepath = os.path.join(instance.basepath(), "routes")
    fs = season.util.os.FileSystem(basepath)
    if fs.exists(app_id):
        wiz.response.status(401, "ID already used")
    allowed = "qwertyuiopasdfghjklzxcvbnm.1234567890"
    for c in app_id:
        if c not in allowed:
            wiz.response.status(500, "only alphabet and number and . in package id")
    app = instance.src.plugin.route(app_id)
    try:
        app.update(data)
        app.manager.clean()
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def route_rename():
    app_id = wiz.request.query("app_id", True)
    rename = wiz.request.query("rename", True)
    if len(rename) < 4 or len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    basepath = os.path.join(instance.basepath(), "routes")
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
    if len(app_id) < 3:
        wiz.response.status(404, "APP ID must be at least 3 characters ")

    data = wiz.request.query("data", True)
    data = json.loads(data)
    app = instance.src.plugin.route(app_id)
    try:
        app.update(data)
        app.manager.clean()
    except Exception as e:
        wiz.response.status(400, str(e))
    wiz.response.status(200)

def route_delete():
    app_id = wiz.request.query("app_id", True)
    basepath = os.path.join(instance.basepath(), "routes")
    fs = season.util.os.FileSystem(basepath)
    if len(app_id) >= 3 and fs.exists(app_id):
        fs.delete(app_id)
    wiz.response.status(200)

def file_create():
    mode = wiz.request.query("mode", True)
    path = wiz.request.query("path", True)
    name = wiz.request.query("name", True)
    ftype = wiz.request.query("type", True)
    data = wiz.request.query("data", "")

    if len(name) == 0:
        wiz.response.status(404, 'input file name')
    
    while len(path) > 0 and path[0] == "/":
        path = path[1:]
    if mode in ['controller', 'model']:
        mode = os.path.join('interfaces', mode)

    basepath = os.path.join(instance.basepath(), mode, path)
    fs = season.util.os.FileSystem(basepath)

    if fs.exists(name):
        wiz.response.status(404, 'Already exists filename')

    if ftype == 'folder':
        fs.makedirs(name)
    else:
        fs.write(name, data)

    wiz.response.status(200)

def file_update():
    mode = wiz.request.query("mode", True)
    path = wiz.request.query("path", True)
    name = wiz.request.query("name", True)
    ftype = wiz.request.query("type", True)
    data = wiz.request.query("data", "")

    while len(path) > 0 and path[0] == "/":
        path = path[1:]
    if mode in ['controller', 'model']:
        mode = os.path.join('interfaces', mode)

    basepath = os.path.join(instance.basepath(), mode)

    basename = os.path.basename(path)
    dirname = os.path.dirname(path)

    basepath = os.path.join(instance.basepath(), mode, dirname)
    fs = season.util.os.FileSystem(basepath)

    if basename != name:
        if fs.exists(basename):
            fs.rename(basename, name)
        else:
            wiz.response.status(404)

    if ftype == 'code':
        fs.write(name, data)
    
    wiz.response.status(200)

def file_delete():
    mode = wiz.request.query("mode", True)
    if mode in ['controller', 'model']: mode = os.path.join('interfaces', mode)
    basepath = os.path.join(instance.basepath(), mode)
    fs = season.util.os.FileSystem(basepath)
    path = wiz.request.query("path", True)
    while len(path) > 0 and path[0] == "/":
        path = path[1:]
    if len(path) > 0:
        if fs.exists(path):
            fs.remove(path)
    wiz.response.status(200)

def download():
    mode = wiz.request.query("mode", True)
    if mode in ['controller', 'model']: mode = os.path.join('interfaces', mode)
    basepath = os.path.join(instance.basepath(), mode)
    fs = season.util.os.FileSystem(basepath)

    path = wiz.request.query("path", True)
    while len(path) > 0 and path[0] == "/":
        path = path[1:]
    
    if fs.isdir(path):
        path = fs.abspath(path)
        filename = os.path.splitext(os.path.basename(path))[0] + ".zip"
        zippath = os.path.join(tempfile.gettempdir(), 'dizest', datetime.datetime.now().strftime("%Y%m%d"), str(int(time.time())), filename)
        if len(zippath) < 10: return
        try:
            shutil.remove(zippath)
        except:
            pass
        os.makedirs(os.path.dirname(zippath))
        zipdata = zipfile.ZipFile(zippath, 'w')
        for folder, subfolders, files in os.walk(path):
            for file in files:
                zipdata.write(os.path.join(folder, file), os.path.relpath(os.path.join(folder,file), path), compress_type=zipfile.ZIP_DEFLATED)
        zipdata.close()
        wiz.response.download(zippath, as_attachment=True, filename=filename)
    else:
        path = fs.abspath(path)
        wiz.response.download(path, as_attachment=True)

    wiz.response.abort(404)
