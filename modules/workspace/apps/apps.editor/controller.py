import os
import season

kwargs['category'] = wiz.server.config.wiz.category
kwargs['theme'] = [""] + wiz.src.theme.list()

branchfs = wiz.branchfs()

ctrls = [""]
controllers = branchfs.list("interfaces/controller")
for ctrl in controllers:
    ctrl = os.path.splitext(ctrl)[0]
    ctrls.append(ctrl)
kwargs['controller'] = ctrls