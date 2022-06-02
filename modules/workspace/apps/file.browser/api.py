import season
import json
import os
import zipfile
import tempfile
import time
import datetime
import shutil

target = wiz.request.query("target", True)
path = wiz.request.query("path", True)
while len(path) > 0 and path[0] == "/":
    path = path[1:]
orgpath = path
basepath = os.path.join(season.path.project, "branch", wiz.branch(), target)
fs = season.util.os.FileSystem(basepath)

def ls():
    res = fs.list(path)
    for i in range(len(res)):
        obj = dict()
        obj['name'] = res[i]
        objpath = orgpath + "/" + res[i]
        if objpath[0] == "/": objpath = objpath[1:]
        obj['path'] = objpath
        obj['type'] = 'folder'
        filepath = fs.abspath(os.path.join(path, res[i]))
        if fs.isfile(os.path.join(path, res[i])):
            obj['type'] = 'file'
            obj['size'] = os.path.getsize(filepath)
        obj['ctime'] = os.path.getctime(filepath)
        res[i] = obj

    wiz.response.status(200, res)

def read():
    extmap = wiz.server.config.wiz.file_support
    ext =  os.path.splitext(path)[1].lower()
    if ext in extmap:
        exttype = extmap[ext]
        if exttype == 'image':
            wiz.response.status(200, {"type": "image", "data": path})
    
        if exttype.split("/")[0] == 'code':
            codelang = exttype.split("/")[1]
            wiz.response.status(200, {"type": "code", "lang": codelang, "data": fs.read(path)})

    wiz.response.status(200, {"type": "notsupported"})

def rename():
    name = wiz.request.query("name", True)
    rename = wiz.request.query("rename", True)

    if len(rename) == 0:
        wiz.response.status(500)    
    
    name = os.path.join(path, name)
    rename = os.path.join(path, rename)

    fs.move(name, rename)
    wiz.response.status(200)

def update():
    data = wiz.request.query("data", True)
    fs.write(path, data)
    wiz.response.status(200)

def create():
    name = wiz.request.query("name", True)    
    name = os.path.join(path, name)
    fs.makedirs(name)
    wiz.response.status(200)

def upload():
    filepath = wiz.request.query("filepath", "[]")
    filepath = json.loads(filepath)
    files = wiz.request.files()
    for i in range(len(files)):
        f = files[i]
        if len(filepath) > 0: name = filepath[i]
        else: name = f.filename
        name = os.path.join(path, name)
        fs.write.file(name, f)
    wiz.response.status(200)

def delete():
    name = wiz.request.query("name", True)    
    name = os.path.join(path, name)
    fs.delete(name)
    wiz.response.status(200)

def download():
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
