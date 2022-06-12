let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    const TREE_DATA = [
        { path: "", name: wiz.data.target, type: 'folder', icon: 'fa-layer-group', display: wiz.data.title }
    ];

    let alert = async (message) => {
        await wiz.connect("modal.message")
            .data({
                title: "Alert",
                message: message,
                btn_action: "Close",
                btn_class: "btn-primary"
            })
            .event("modal-show");
    }

    $scope.monaco = function (language) {
        var opt = {
            value: '',
            language: language,
            theme: "vs",
            fontSize: 14,
            automaticLayout: true,
            minimap: {
                enabled: false
            }
        };
        return opt;
    }

    $scope.display = {};
    $scope.display.date = function (date) {
        let targetdate = moment(date);
        let diff = new Date().getTime() - new Date(targetdate).getTime();
        diff = diff / 1000 / 60 / 60;

        if (diff > 24) return targetdate.format("YYYY-MM-DD hh:mm");
        if (diff > 1) return Math.floor(diff) + " hours ago"

        diff = diff * 60;

        if (diff < 2) return "just now";

        return Math.floor(diff) + " minutes ago";
    }
    $scope.display.filesize = (value) => {
        if (!value) return "--";
        let kb = value / 1024;
        if (kb < 1) return value + "B";
        let mb = kb / 1024;
        if (mb < 1) return Math.round(kb * 100) / 100 + "KB";
        let gb = mb / 1024;
        if (gb < 1) return Math.round(mb * 100) / 100 + "MB";
        return Math.round(gb * 100) / 100 + "GB";
    }

    $scope.display.timer = (value) => {
        return moment(new Date(value * 1000)).format("YYYY-MM-DD HH:mm:ss");
    }

    let api = async (action, query) => {
        if (!query) query = {};
        query = angular.copy(query);
        query.target = wiz.data.target;
        let res = await wiz.API.async(action, query);
        if (res.code == 200) {
            return res.data;
        }
        throw Exception(res.data);
    }

    let hashs = location.hash.split("#");
    let hash = "";
    for (let i = 0; i < hashs.length; i++) {
        if (hashs[i].startsWith("path=")) {
            hash = decodeURIComponent(hashs[i].split("=")[1]);
        }
    }

    $scope.query = { path: hash };

    $scope.loader = false;
    $scope.data = {};
    $scope.data.newitem = {};
    $scope.data.checked = [];

    $scope.load_folder = async (item) => {
        await $scope.viewer.close();
        if (item) {
            $scope.query.path = item.path;
            location.href = "#path=" + encodeURIComponent($scope.query.path);
            await $scope.tree.load($scope.tree.cache[item.path], true);
        }

        $scope.files = await api("ls", $scope.query);
        $scope.files.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        $scope.files.sort((a, b) => {
            return b.type.localeCompare(a.type);
        });

        $scope.data.checked = [];
        $scope.data.checked_all = false;
        await $timeout();
    }

    $scope.load_file = async (item) => {
        let query = angular.copy($scope.query);
        query.path = item.path;
        let res = await api("read", query);

        if (res.type == 'image') {
            $scope.viewer.mode = 'image';
            $scope.viewer.data = $scope.download(item);
            $scope.viewer.path = item.path;
            await $timeout();
        } else if (res.type == 'code') {
            $scope.viewer.mode = '';
            await $timeout();
            
            $scope.viewer.path = item.path;
            $scope.viewer.mode = 'code';
            $scope.viewer.data = res.data;
            $scope.viewer.code_property = $scope.monaco(res.lang);
            $scope.viewer.code_property.onLoad = async (editor) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function () {
                    $scope.viewer.save();
                });
            };
            await $timeout();
        } else {
            alert("Not supported file");
        }
    }

    $scope.load = async (item) => {
        if (item) {
            if (item.type == 'folder') {
                await $scope.load_folder(item);
            } else {
                await $scope.load_file(item);
            }
        } else {
            await $scope.load_folder();
        }
    }

    $scope.load_parent = async () => {
        let path = $scope.query.path.split("/");
        path = path.splice(0, path.length - 1);
        path = path.join("/");
        $scope.query.path = path;
        location.href = "#path=" + encodeURIComponent($scope.query.path);
        await $scope.load();
        await $timeout();
    }

    // viewer
    $scope.viewer = {};
    $scope.viewer.path = null;
    $scope.viewer.mode = null;
    $scope.viewer.data = null;

    $scope.viewer.close = async () => {
        $scope.viewer.path = null;
        $scope.viewer.mode = null;
        $scope.viewer.data = null;
        $timeout();
    }

    $scope.viewer.save = async () => {
        let data = angular.copy($scope.viewer.data);
        let query = {};
        query.path = $scope.viewer.path;
        query.data = data;
        try {
            let res = await api("update", query);
            toastr.success('Saved');
        } catch (e) {
            toastr.error('Error');
        }
    }

    // event
    $scope.download = (file) => {
        return wiz.API.url("download?target=" + wiz.data.target + "&path=" + encodeURIComponent(file.path));
    }

    $scope.event = {};
    $scope.event.rename = async (file) => {
        file.rename = file.name;
        file.edit = true;
        await $timeout();
    }

    $scope.event.create = async () => {
        $scope.data.newitem = { type: 'folder' };
        await $timeout();
        $('#offcanvas-create-folder').offcanvas("show");
    }

    $scope.event.drop = {};
    $scope.event.drop.text = "Drop File Here!"
    $scope.event.drop.ondrop = async (e, files) => {
        let fd = new FormData();
        let filepath = [];
        fd.append("mode", $scope.mode);
        fd.append("path", $scope.query.path);
        for (let i = 0; i < files.length; i++) {
            fd.append('file[]', files[i]);
            filepath.push(files[i].filepath);
        }
        fd.append("filepath", JSON.stringify(filepath));
        await $scope.api.upload(fd);
    }

    $scope.event.upload = function () {
        $('#file-upload').click();
    };

    let fileinput = document.getElementById('file-upload');
    fileinput.onchange = async () => {
        let fd = new FormData($('#file-form')[0]);
        fd.append("mode", $scope.mode);
        fd.append("path", $scope.query.path);
        await $scope.api.upload(fd);
    };

    $scope.event.check = async (file) => {
        if (!file) {
            let checkstatus = true;
            if ($scope.data.checked.length > 0) {
                checkstatus = false;
                $scope.data.checked = [];
            }

            for (let i = 0; i < $scope.files.length; i++) {
                $scope.files[i].checked = checkstatus;
                if (checkstatus)
                    $scope.data.checked.push($scope.files[i].name);
            }

            $scope.data.checked_all = checkstatus;
            await $timeout();
            return;
        }

        file.checked = !file.checked;
        if (file.checked && !$scope.data.checked.includes(file.name)) {
            $scope.data.checked.push(file.name);
        }
        if (!file.checked) {
            $scope.data.checked.remove(file.name);
        }

        $scope.data.checked_all = $scope.data.checked.length > 0;
        await $timeout();
    }

    $scope.event.loader = async (status) => {
        $scope.loader = status;
        await $timeout();
    }

    $scope.api = {};

    $scope.api.upload = async (data) => {
        let fn = (fd) => new Promise((resolve) => {
            let url = wiz.API.url('upload?target=' + wiz.data.target);
            $.ajax({
                url: url,
                type: 'POST',
                data: fd,
                cache: false,
                contentType: false,
                processData: false
            }).always(function (res) {
                resolve(res);
            });
        });

        await $scope.event.loader(true);
        await fn(data);
        await $scope.load();
        await $scope.event.loader(false);

        await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
    };

    $scope.api.rename = async (file) => {
        let data = angular.copy(file);
        data.path = $scope.query.path;
        await api('rename', data);
        await $scope.load();
        await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
    }

    $scope.api.remove = async (file) => {
        $scope.event.loader(true);
        let data = angular.copy(file);
        data.path = $scope.query.path;
        await api('delete', data);
        await $scope.load();
        $scope.event.loader(false);
        await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
    }

    $scope.api.remove_all = async (files) => {
        $scope.event.loader(true);
        for (let i = 0; i < files.length; i++) {
            let data = { name: files[i], path: $scope.query.path };
            await api('delete', data);
        }
        await $scope.load();
        $scope.event.loader(false);
        await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
    }

    $scope.api.create = async (file) => {
        let data = angular.copy(file);
        data.path = $scope.query.path;

        if (data.type == 'folder') {
            await api('create', data);
            await $scope.load();
            $('#offcanvas-create-folder').offcanvas("hide");
            await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
        } else {
            data.path = data.path + "/" + data.name;
            data.data = "";
            try {
                await api("update", data);
                toastr.success('Saved');
            } catch (e) {
                toastr.error('Error');
            }
            await $scope.load();
            $('#offcanvas-create-folder').offcanvas("hide");
            await $scope.tree.load($scope.tree.cache[$scope.query.path], true);
        }
    }

    // tree data
    $scope.tree = {};
    $scope.tree.data = TREE_DATA;
    $scope.tree.cache = {};
    $scope.tree.current = null;

    $scope.tree.init = async () => {
        for (let i = 0; i < $scope.tree.data.length; i++) {
            let item = $scope.tree.data[i];
            $scope.tree.cache[item.path] = item;
            if (item.type == "folder" && !item.sub) {
                await $scope.tree.load(item);
            }
        }
    }

    $scope.tree.load = async (item, forced) => {
        if (!item) return;

        // ignore dbl click
        if ($scope.tree.timestamp) {
            let timestamp = new Date().getTime() - $scope.tree.timestamp;
            $scope.tree.lasttimestamp = timestamp;
        }
        $scope.tree.timestamp = new Date().getTime();
        await $timeout(300);
        if ($scope.tree.lasttimestamp < 300) {
            return;
        }

        // load folder items
        if (item.type == 'folder') {
            if (!forced && item.sub) {
                delete item.sub;
            } else {
                let res = await api("ls", { path: item.path });
                res.sort(function (a, b) {
                    if (a.type == 'folder' && b.type != 'folder') return -1;
                    if (a.type != 'folder' && b.type == 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });

                for (var i = 0; i < res.length; i++) {
                    if (res[i].type == 'file') res[i].icon = 'fa-file'
                    else if (res[i].type == 'folder') res[i].icon = 'fa-folder'
                    else res[i].icon = 'fa-caret-right'

                    if ($scope.tree.cache[res[i].path]) {
                        res[i] = $scope.tree.cache[res[i].path];
                    } else {
                        $scope.tree.cache[res[i].path] = res[i];
                    }
                }
                item.sub = res;
            }

            await $timeout();
        }
    }

    await $scope.load();
    await $scope.tree.init();
}