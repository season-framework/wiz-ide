import season

git = wiz.model("git")()

src = kwargs['src'] = wiz.request.segment.src
dest = kwargs['dest'] = wiz.request.segment.dest

changes = git.pr_conflicts(src, dest)
kwargs['diff'] = changes