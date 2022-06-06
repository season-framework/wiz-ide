let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.target = "server";

    $scope.monaco = (function (language) {
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

        opt.onLoad = async (editor) => {
            let shortcuts = $scope.shortcut.configuration(window.monaco);
            for (let shortcutname in shortcuts) {
                let monacokey = shortcuts[shortcutname].monaco;
                let fn = shortcuts[shortcutname].fn;
                if (!monacokey) continue;
                editor.addCommand(monacokey, async () => {
                    await fn();
                });
                await $scope.shortcut.bind();
            }
        }
        return opt;
    })('python');

    $scope.load = async (target) => {
        $scope.target = target;
        let data = await wiz.API.async('load', { target: target });
        $scope.data = data.data;
        await $timeout();
    }

    $scope.update = async () => {
        let res = await wiz.API.async('update', { target: $scope.target, data: $scope.data });
        if (res.code != 200) {
            toastr.error(res.data);
        } else {
            toastr.success("Saved");
        }
        await $timeout();
    }

    $scope.shortcut = {};
    $scope.shortcut.configuration = (monaco) => {
        return {
            'save': {
                key: 'Ctrl KeyS',
                desc: 'save',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                fn: async () => {
                    await $scope.update();
                }
            }
        }
    };

    $scope.shortcut.bind = async () => {
        $(window).unbind();

        let shortcut_opts = {};
        let shortcuts = $scope.shortcut.configuration(window.monaco);

        for (let key in shortcuts) {
            let keycode = shortcuts[key].key;
            let fn = shortcuts[key].fn;
            if (!keycode) continue;
            shortcut_opts[keycode] = async (ev) => {
                ev.preventDefault();
                await fn();
            };
        }

        season.shortcut(window, shortcut_opts);
    }

    $scope.load('server');
}