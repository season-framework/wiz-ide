import git
import os
from os.path import join
import season
import io

BASEPATH = join(season.path.project, 'origin')
srcfs = season.util.os.FileSystem(BASEPATH)

BASEPATH = join(season.path.project, 'branch')
fs = season.util.os.FileSystem(BASEPATH)

BASEPATH = join(season.path.project, 'merge')
mergefs = season.util.os.FileSystem(BASEPATH)

gitignore = """__pycache__/\n.*"""

class Git:
    def __init__(self, manager, branch):
        if branch not in manager.branches():
            raise Exception(f"Branch `{branch}` not exists")
        
        self.branch = branch
        self.manager = manager
        self.repo = git.Repo.init(fs.abspath(branch))

    def commits(self, max_count=5, skip=0):
        try:
            branch = self.branch
            commits = list(self.repo.iter_commits(branch, max_count=max_count, skip=skip))
            for i in range(len(commits)):
                commits[i] = {
                    "author": commits[i].author.name, 
                    "author_email": commits[i].author.email, 
                    "committer": commits[i].committer.name, 
                    "committer_email": commits[i].committer.email, 
                    "datetime": commits[i].committed_datetime, 
                    "message": commits[i].message,
                    "id": str(commits[i])
                }
        except Exception as e:
            commits = []
        return commits

    def author(self, name=None, email=None):
        if name is not None:
            self.repo.config_writer().set_value("user", "name", name).release()
        if email is not None:
            self.repo.config_writer().set_value("user", "email", email).release()

        author = dict()
        try: author['name'] = self.repo.config_reader().get_value("user", "name")
        except: author['name'] = 'wiz'
        try: author['email'] = self.repo.config_reader().get_value("user", "email")
        except: author['email'] = 'wiz@localhost'
        return author

    def push(self, remote='wiz'):
        origin = self.repo.remote(name=remote)
        origin.push(self.branch)

    def pull(self, remote='wiz'):
        origin = self.repo.remote(name=remote)
        origin.pull(self.branch)
        if self.branch != self.manager.main:
            origin.pull(self.manager.main)

    def changed(self):
        return len(self.diff())

    def diff(self, commit=None):
        repo = self.repo
        
        if commit is None:
            repo.git.add('--all')
            src = "index"
            parent = repo.commit()
            diffs = parent.diff(None)
        else:
            commit = repo.commit(commit)
            src = str(commit)
            if len(commit.parents) == 0:
                parent = None
                diffs = []
            else:
                parent = str(commit.parents[0])
                parent = repo.commit(parent)
                diffs = parent.diff(str(commit))
        
        res = []
        for diff in diffs:
            res.append({"change_type": diff.change_type, "parent_path": diff.a_path, "commit_path": diff.b_path, "commit": src, "parent": str(parent)})

        return res

class Model:
    def __init__(self):
        self.cache = dict()

        # find main branch
        mainbranch = "main"
        if fs.exists("main") == False and fs.exists("master"): 
            mainbranch = "master"
        self.main = mainbranch

        # if main branch not exists, create main
        if fs.exists(join(mainbranch, '.git')) == False:
            repo = git.Repo.init(fs.abspath(mainbranch))
            fs.write.file(join(mainbranch, ".gitignore"), gitignore)
            repo.git.add('--all')
            repo.index.commit(message)

        if srcfs.exists() == False:
            git.Repo.init(srcfs.abspath(), bare=True)
            branches = self.branches()
            for branch in branches:
                repo = git.Repo.init(fs.abspath(branch))
                try:
                    origin = repo.remote(name='wiz')
                    repo.delete_remote(origin)
                except:
                    pass
                origin = repo.create_remote('wiz', srcfs.abspath())
                origin.push(branch)

    def clean(self):
        srcfs.delete()
        git.Repo.init(srcfs.abspath(), bare=True)
        branches = self.branches()
        for branch in branches:
            repo = git.Repo.init(fs.abspath(branch))
            try:
                origin = repo.remote(name='wiz')
                repo.delete_remote(origin)
            except:
                pass
            origin = repo.create_remote('wiz', srcfs.abspath())
            origin.push(branch)

    def branch(self, branch=None):
        return self.git(branch=branch)

    def git(self, branch=None):
        if branch is None:
            branch = self.main
        if branch not in self.branches():
            raise Exception(f"Branch `{branch}` not exists")
        if branch in self.cache:
            return self.cache[branch]
        obj = Git(self, branch)
        self.cache[branch] = obj
        return obj

    def archive(self, branch):
        if branch in ['master', 'main']:
            raise Exception("Now allowed branch name")
        if len(branch) < 3:
            raise('branch name must be at least 3 characters')
        if fs.exists(branch) == False:
            raise Exception(f"active branch `{branch}` not exists")
        fs.delete(branch)

    def delete(self, branch):
        if branch in ['master', 'main']:
            raise Exception("Now allowed branch name")
        if len(branch) < 3:
            raise('branch name must be at least 3 characters')
        git.Repo.init(srcfs.abspath(), bare=True).git.branch("-D", branch)

    def create(self, base, branch, name=None, email=None):
        if branch in ['master', 'main']:
            raise Exception("Now allowed branch name")
        if len(branch) < 3:
            raise('branch name must be at least 3 characters')

        # check branch exists
        if fs.exists(join(base, '.git')) == False:
            raise Exception("base branch not exists")
        if fs.exists(join(branch, '.git')):
            raise Exception(f"Already exists branch `{branch}`")
        
        repo = git.Repo.init(fs.abspath(branch))
        origin = repo.create_remote('wiz', srcfs.abspath())
        origin.fetch()

        base_head = repo.create_head(branch, origin.refs[base])
        repo.head.set_reference(base_head)
        base_head.checkout()

        branch_head = repo.create_head(branch)
        repo.head.set_reference(branch_head)
        branch_head.checkout()

        self.git(branch).push()
        self.git(branch).author(name=name, email=email)

    def branches(self, mode='active', info=False):
        res = []
        if mode == 'active':
            branches = fs.list()
            for branch in branches:
                try:
                    if info:
                        obj = self.git(branch)
                        data = dict()
                        data['author'] = obj.author()
                        data['name'] = branch
                        data['diff'] = obj.changed()
                    else:
                        data = branch
                    res.append(data)
                except Exception as e:
                    pass
        elif mode == 'stale':
            bare = git.Repo.init(srcfs.abspath(), bare=True)
            return [h.name for h in bare.heads]

        return res

    def restore(self, branch):
        if branch in ['master', 'main']:
            raise Exception("Now allowed branch name")
        if len(branch) < 3:
            raise('branch name must be at least 3 characters')
        if fs.exists(join(branch, '.git')):
            raise Exception(f"Already exists branch `{branch}`")
        
        base = self.main
        
        # git init
        repo = git.Repo.init(fs.abspath(branch))

        # add origin and pull
        origin = repo.create_remote('wiz', srcfs.abspath())
        origin.fetch()

        # add main head
        base_head = repo.create_head(base, origin.refs[base])
        repo.head.set_reference(base_head)

        # add branch head
        branch_head = repo.create_head(branch, origin.refs[branch])
        repo.head.set_reference(branch_head)

        branch_head.checkout()

    def pr_request(self, src, dest, name=None, email=None):
        if fs.exists(join(src, '.git')) == False:
            raise Exception("source branch not exists")
        if fs.exists(join(dest, '.git')) == False:
            raise Exception("dest branch not exists")

        mergefs.delete(os.path.join(src, dest))
        repo = git.Repo.init(mergefs.abspath(os.path.join(src, dest)))
        origin = repo.create_remote('wiz', srcfs.abspath())
        origin.fetch()
        
        # load sources
        src_head = repo.create_head(src, origin.refs[src])
        repo.head.set_reference(src_head)
        
        # load dest branch
        dest_head = repo.create_head(dest, origin.refs[dest])
        repo.head.set_reference(dest_head)

        # checkout dest
        dest_head.checkout()

        # merge
        repo.git.checkout(dest)
        try:
            repo.git.merge(src)
        except:
            pass

        # check diff
        unmerged_blobs = repo.index.unmerged_blobs()
        conflicts = []
        for path in unmerged_blobs:
            list_of_blobs = unmerged_blobs[path]
            for (stage, blob) in list_of_blobs:
                if stage != 0:
                    if path not in conflicts:
                        conflicts.append(path)

        for path in conflicts:
            copy1 = fs.abspath(os.path.join(src, path))
            copy2 = mergefs.abspath(os.path.join(src, dest, path))
            mergefs.copy(copy1, copy2)

        if name is not None:
            repo.config_writer().set_value("user", "name", name).release()
        if email is not None:
            repo.config_writer().set_value("user", "email", email).release()

    def pr_conflicts(self, src, dest):
        if fs.exists(join(src, '.git')) == False:
            raise Exception("source branch not exists")
        if fs.exists(join(dest, '.git')) == False:
            raise Exception("dest branch not exists")

        repo = git.Repo.init(mergefs.abspath(os.path.join(src, dest)))
        unmerged_blobs = repo.index.unmerged_blobs()
        conflicts = []
        for path in unmerged_blobs:
            list_of_blobs = unmerged_blobs[path]
            for (stage, blob) in list_of_blobs:
                if stage != 0:
                    if path not in conflicts:
                        conflicts.append(path)

        parent = repo.commit()
        diffs = parent.diff(None)

        changes = []
        for diff in diffs:
            changes.append({"change_type": diff.change_type, "parent_path": diff.a_path, "commit_path": diff.b_path})
        
        res = dict()
        res['diff'] = changes
        res['conflict'] = conflicts
        
        return res

    def pr_delete(self, src, dest):
        mergefs.delete(os.path.join(src, dest))

    def pr_list(self):
        res = []
        sources = mergefs.list()
        for src in sources:
            targets = mergefs.list(src)
            for target in targets:
                if mergefs.exists(os.path.join(src, target, '.git')):
                    try:
                        repo = git.Repo.init(mergefs.abspath(os.path.join(src, target)))
                        name = repo.config_reader().get_value("user", "name")
                        email = repo.config_reader().get_value("user", "email")
                        res.append({ 'target': target, 'source': src, 'author': { 'name': name, 'email': email } })
                    except Exception as e:
                        pass
        return res

    def pr_diff(self, src, dest, src_path, dest_path):
        repo = git.Repo.init(mergefs.abspath(os.path.join(src, dest)))
        commit = repo.commit()

        try:
            src_file = commit.tree / src_path
            f = io.BytesIO(src_file.data_stream.read())
            src_file = f.read().decode('utf-8')
        except:
            src_file = ""

        dest_file = mergefs.read(os.path.join(src, dest, dest_path))
        return src_file, dest_file

    def pr_merge(self, src, dest):
        repo = git.Repo.init(mergefs.abspath(os.path.join(src, dest)))
        repo.git.add('--all')
        repo.index.commit(f"merge {src} to {dest}")
        
        origin = repo.remote(name='wiz')
        origin.push(dest).raise_if_error()
        self.branch(dest).pull()
        self.branch(src).pull()
        mergefs.delete(os.path.join(src, dest))