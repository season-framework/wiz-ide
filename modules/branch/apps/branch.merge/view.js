let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    let platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown'
    $scope.ismac = platform.toUpperCase().indexOf('MAC') >= 0;

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

    $scope.trustAsHtml = $sce.trustAsHtml;
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

    $scope.data = {};

    $scope.data.diff = wiz.data.diff;

    for (let i = 0; i < $scope.data.diff.diff.length; i++) {
        $scope.data.diff.diff[i].color = 'bg-secondary';
        if ($scope.data.diff.diff[i].change_type == 'M')
            $scope.data.diff.diff[i].color = 'bg-yellow';
        if ($scope.data.diff.diff[i].change_type == 'R')
            $scope.data.diff.diff[i].color = 'bg-yellow';
        if ($scope.data.diff.diff[i].change_type == 'D')
            $scope.data.diff.diff[i].color = 'bg-red';
        if ($scope.data.diff.diff[i].change_type == 'A')
            $scope.data.diff.diff[i].color = 'bg-green';
    }

    $scope.editor = async (item, conflict) => {
        if (conflict)
            item = { parent_path: item, commit_path: item };

        let res = await wiz.API.async("code", { src: wiz.data.src, dest: wiz.data.dest, parent_path: item.parent_path, commit_path: item.commit_path });

        let langdetect = (filepath) => {
            let fileTypes = {
                pug: 'pug',
                html: 'html',
                scss: 'scss',
                less: 'less',
                css: 'css',
                js: 'javascript',
                json: 'json',
                md: 'markdown',
                mjs: 'javascript',
                ts: 'typescript'
            }
            try {
                ext = filepath.split('.');
                ext = ext[ext.length - 1];
                if (fileTypes[ext]) return fileTypes[ext];
            } catch (e) { }
            return 'python';
        }

        $scope.data.editor = {
            compare: {
                code: res.data.src,
                language: langdetect(item.parent_path)
            },
            main: {
                code: res.data.dest,
                language: langdetect(item.commit_path)
            }
        };

        $scope.current = item;

        await $timeout();
    }

    $scope.merge = async () => {
        let data = {};
        data.src = wiz.data.src;
        data.dest = wiz.data.dest;
        let res = await wiz.API.async("merge", data);
        if (res.code == 200) {
            location.href = wiz.url + '/ui/branch';
            return;
        }
        else alert(res.data);
    }

    $scope.save = async () => {
        let current = angular.copy($scope.current);
        let data = {};
        data.path = current.commit_path
        data.code = $scope.data.editor.main.code;
        data.src = wiz.data.src;
        data.dest = wiz.data.dest;
        let res = await wiz.API.async("update", data);
        if (res.code == 200) toastr.success("Saved");
        else alert(res.data);
    }

    $scope.monaco_config = { enableSplitViewResizing: false, fontSize: 14, originalEditable: false };
    $scope.monaco_config.onLoad = async (editor) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, async () => {
            await $scope.save();
        });
    };
    await $timeout();
}