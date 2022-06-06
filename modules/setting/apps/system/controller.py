import season
import os
import time
import psutil
import platform
import resource

process = psutil.Process(os.getpid())

data = season.stdClass()
data.deploy = season.stdClass()
data.deploy.wiz_version = season.version
data.deploy.python_version = platform.python_version()
data.deploy.pid = os.getpid()

data.system = season.stdClass()
data.system.uptime = int(time.time() - psutil.boot_time())
data.system.started = int(time.time() - process.create_time())

data.system.memory = season.stdClass()
data.system.memory.usage = psutil.virtual_memory().used
data.system.memory.dizest_usage = process.memory_info().rss
data.system.memory.total = psutil.virtual_memory().total

data.system.cpu = season.stdClass()
data.system.cpu.count = psutil.cpu_count()
data.system.cpu.usage = psutil.cpu_percent()
data.system.cpu.dizest_usage = process.cpu_percent()

data.system.disk = season.stdClass()
hdd = psutil.disk_usage('/')
data.system.disk.total = hdd.total
data.system.disk.used = hdd.used
data.system.disk.free = hdd.free

children = process.children(recursive=True)
processes = []
for child in children:
    obj = dict()
    obj['status'] = child.status()
    obj['pid'] = child.pid
    obj['parent'] = child.parent().pid
    obj['cmd'] = child.name()
    obj['time'] = int(time.time() - child.create_time())
    processes.append(obj)

data.process = season.stdClass()
data.process.children = processes

kwargs['data'] = dict(data)