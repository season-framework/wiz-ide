import os
import season

git = wiz.model("git")()
BASEPATH = os.path.join(season.path.project, 'merge')
mergefs = season.util.os.FileSystem(BASEPATH)

def code():
    src = wiz.request.query("src", True)
    dest = wiz.request.query("dest", True)
    parent_path = wiz.request.query("parent_path", True)
    commit_path = wiz.request.query("commit_path", True)
    src, dest = git.pr_diff(src, dest, parent_path, commit_path)
    res = dict()
    res['src'] = src
    res['dest'] = dest
    wiz.response.status(200, res)

def update():
    try:
        src = wiz.request.query("src", True)
        dest = wiz.request.query("dest", True)
        path = wiz.request.query("path", True)
        code = wiz.request.query("code", True)
        mergefs.write(os.path.join(src, dest, path), code)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def merge():
    try:
        src = wiz.request.query("src", True)
        dest = wiz.request.query("dest", True)
        git.pr_merge(src, dest)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)