import pkg_resources
import subprocess
import sys

executable = str(sys.executable)
if wiz.server.config.wiz.python_executable is not None:
    executable = wiz.server.config.wiz.python_executable

def install():
    package = wiz.request.query("package", True)
    output = subprocess.run([str(executable), "-m", "pip", "install", str(package), "--upgrade"], capture_output=True)
    wiz.response.status(200, str(output.stdout.decode("utf-8")))

def installed():
    output = subprocess.run([str(executable), "-m", "pip", "freeze"], capture_output=True)
    output = output.stdout.decode("utf-8")
    output = output.split("\n")
    installed = []
    for i in range(len(output)):
        if len(output[i]) == 0: continue
        output[i] = output[i].split("==")
        obj = dict()
        obj['name'] = output[i][0]
        try:
            obj['version'] = output[i][1]
        except:
            pass
        installed.append(obj)
    wiz.response.status(200, installed)
