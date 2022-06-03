import os
import season

kwargs['category'] = wiz.server.config.wiz.category
kwargs['theme'] = [""] + wiz.src.theme.list()
kwargs['is_dev'] = wiz.is_dev()
kwargs['branch'] = wiz.branch()
kwargs['branches'] = wiz.branches()

branchfs = wiz.branchfs()

ctrls = [""]
controllers = branchfs.list("interfaces/controller")
for ctrl in controllers:
    ctrl = os.path.splitext(ctrl)[0]
    ctrls.append(ctrl)

kwargs['controller'] = ctrls