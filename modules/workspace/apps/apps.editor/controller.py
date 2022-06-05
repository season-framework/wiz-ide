import os
import season

kwargs['category'] = wiz.server.config.wiz.category
kwargs['theme'] = [""] + wiz.src.theme.list()

branchfs = wiz.branchfs()
ctrls = [""]
controllers = branchfs.files(os.path.join("interfaces", "controller"), recursive=True)
for ctrl in controllers:
    ctrl = ctrl.replace(os.path.join("interfaces", "controller") + "/", "")
    if branchfs.isfile(os.path.join("interfaces", "controller", ctrl)):
        ctrl = os.path.splitext(ctrl)[0]
        ctrls.append(ctrl)

kwargs['controller'] = ctrls