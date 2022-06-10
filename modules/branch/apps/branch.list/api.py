git = wiz.model("git")()

def branches():
    res = dict()
    res['active'] = git.branches(info=True)
    
    res['stale'] = []
    rows = git.branches(mode='stale', info=True)
    checker = [x['name'] for x in res['active']]
    for item in rows:
        if item in checker:
            continue
        res['stale'].append(item)

    res['pr'] = git.pr_list()
    wiz.response.status(200, res)

def create():
    try:
        base = wiz.request.query("base", True)
        branch = wiz.request.query("branch", True)
        author_name = wiz.request.query("author_name", None)
        author_email = wiz.request.query("author_email", None)
        git.create(base, branch, name=author_name, email=author_email)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def archive():
    try:
        branch = wiz.request.query("branch", True)
        git.archive(branch)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def restore():
    try:
        branch = wiz.request.query("branch", True)
        git.restore(branch)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def delete():
    try:
        branch = wiz.request.query("branch", True)
        git.delete(branch)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def commits():
    try:
        branch = wiz.request.query("branch", True)
        page = int(wiz.request.query("page", 1))
        page = (page - 1) * 5
        branch = git.branch(branch)
        res = branch.commits(skip=page)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200, res)

def update_author():
    try:
        branch = wiz.request.query("branch", True)
        branch = git.branch(branch)
        name = wiz.request.query("name", True)
        email = wiz.request.query("email", True)
        branch.author(name=name, email=email)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def pr_request():
    try:
        source = wiz.request.query("source", True)
        target = wiz.request.query("target", True)
        name = wiz.request.query("name", True)
        email = wiz.request.query("email", True)
        git.pr_request(source, target, name=name, email=email)
    except Exception as e:
        git.pr_delete(source, target)
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def pr_delete():
    try:
        source = wiz.request.query("source", True)
        target = wiz.request.query("target", True)
        git.pr_delete(source, target)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def clean():
    git.clean()
    wiz.response.status(200)