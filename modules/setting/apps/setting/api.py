import season
import json
import os
import zipfile
import tempfile
import time
import datetime
import shutil

target = wiz.request.query("target", True)
basepath = os.path.join(season.path.project, "config")
fs = season.util.os.FileSystem(basepath)

def load():
    try:
        data = fs.read(f"{target}.py")
    except:
        data = ""
    wiz.response.status(200, data)

def update():
    data = wiz.request.query("data", "")
    try:
        season.util.os.compiler(data, name=target, wiz=wiz)
        fs.write(f"{target}.py", data)
    except Exception as e:
        wiz.response.status(500, str(e))

    wiz.server.config.reload()
    wiz.response.status(200)