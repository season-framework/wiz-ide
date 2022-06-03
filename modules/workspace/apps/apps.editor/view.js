let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    let monaco_option = (language) => {
        let opt = {
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
                    await $scope.shortcut.bind();
                });
            }
        }

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

    $scope.workspace = {};
    $scope.workspace.mode = 'list-mode';
    $scope.workspace.toggle = async () => {
        if ($scope.workspace.mode == 'focus-mode') {
            $scope.workspace.mode = 'list-mode';
        } else {
            $scope.workspace.mode = 'focus-mode';
        }
        await $timeout();
    }

    $scope.data = {};

    try {
        $scope.data.app_id = location.hash.split("#")[1];
    } catch (e) {
        $scope.data.app_id = '';
    }

    $scope.data.branch = wiz.data.branch;
    $scope.data.branches = wiz.data.branches;
    $scope.data.is_dev = wiz.data.is_dev;

    $scope.data.category = wiz.data.category;
    $scope.data.theme = wiz.data.theme;
    $scope.data.controller = wiz.data.controller;
    $scope.data.builder = [
        { 'id': 'text/javascript', 'title': 'Javascript' },
        { 'id': 'text/babel', 'title': 'Babel' },
        { 'id': 'text/typescript', 'title': 'Typescript' }
    ]

    $scope.data.lang = {};
    $scope.data.lang.html = ['pug', 'html'];
    $scope.data.lang.css = ['css', 'scss', 'less'];

    $scope.facet = {};
    $scope.search = {};
    $scope.event = {};

    $scope.event.load = async () => {
        let res = await wiz.API.async("list");
        let data = res.data;
        data.sort();

        $scope.facet.category = {};
        $scope.facet.count = data.length;
        $scope.data.apps = {};

        for (let i = 0; i < data.length; i++) {
            // facet category
            let category = data[i].package.category;
            if (!$scope.facet.category[category]) $scope.facet.category[category] = 0;
            $scope.facet.category[category]++;

            // append data
            if (!$scope.data.apps[category]) $scope.data.apps[category] = [];
            $scope.data.apps[category].push(data[i]);
        }

        await $timeout();
    }

    $scope.event.search = async (val) => {
        val = val.toLowerCase();
        let searchindex = ['title', 'namespace', 'route'];

        for (let category in $scope.data.apps) {
            for (let i = 0; i < $scope.data.apps[category].length; i++) {
                $scope.data.apps[category][i].hide = true;
                for (let j = 0; j < searchindex.length; j++) {
                    try {
                        let key = searchindex[j];
                        let keyv = $scope.data.apps[category][i].package[key].toLowerCase();
                        if (keyv.includes(val)) {
                            $scope.data.apps[category][i].hide = false;
                            break;
                        }
                    } catch (e) {
                    }
                }

                if (val.length == 0)
                    $scope.data.apps[category][i].hide = false;
            }
        }

        $timeout();
    }

    // layout
    $scope.layout = {};
    $scope.layout.checker = (tab) => {
        if (tab == 'tab1') {
            return true;
        } else if (tab == 'tab2') {
            if ([2, 3, 5, 6].includes($scope.layout.active_layout)) {
                return true;
            }
        } else if (tab == 'tab3') {
            if ([3, 6].includes($scope.layout.active_layout)) {
                return true;
            }
        }
        return false;
    }
    $scope.layout.viewstate = {};
    $scope.layout.viewstate.horizonal = {};
    $scope.layout.viewstate.vertical_1_1 = {};
    $scope.layout.viewstate.vertical_1_2 = {};

    if ($(window).width() > 2560) $scope.layout.active_layout = 3;
    else if ($(window).width() > 1640) $scope.layout.active_layout = 2;
    else $scope.layout.active_layout = 4;

    $scope.layout.change = async (layout) => {
        await $timeout();

        $scope.layout.active_layout = layout;

        let _height = $('#editor-area').height();
        let _width = $('#editor-area').width();

        function _horizonal_split() {
            var h = Math.round(_height / 3);
            if (h > 400) h = 400;
            $scope.layout.viewstate.horizonal.lastComponentSize = h;
        }

        function _horizonal_top() {
            $scope.layout.viewstate.horizonal.lastComponentSize = 0;
        }

        let layout_builder = async () => {
            $scope.layout.viewstate = {};
            $scope.layout.viewstate.horizonal = {};
            $scope.layout.viewstate.vertical_1_1 = {};
            $scope.layout.viewstate.vertical_1_2 = {};

            if (layout == 1) {
                _horizonal_top();
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = 0;
            } else if (layout == 2) {
                _horizonal_top();
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = Math.round(_width / 2);
                $scope.layout.viewstate.vertical_1_2.lastComponentSize = 0;
            } else if (layout == 3) {
                _horizonal_top();
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = Math.round(_width / 3 * 2);
                $scope.layout.viewstate.vertical_1_2.lastComponentSize = Math.round(_width / 3);
            } else if (layout == 4) {
                _horizonal_split();
                $scope.layout.viewstate.vertical_1_1.firstComponentSize = _width;
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = 0;
            } else if (layout == 5) {
                _horizonal_split();
                $scope.layout.viewstate.vertical_1_1.firstComponentSize = Math.round(_width / 2);
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = Math.round(_width / 2);
                $scope.layout.viewstate.vertical_1_2.firstComponentSize = Math.round(_width / 2);
                $scope.layout.viewstate.vertical_1_2.lastComponentSize = 0;
            } else if (layout == 6) {
                _horizonal_split();
                $scope.layout.viewstate.vertical_1_1.firstComponentSize = Math.round(_width / 3);
                $scope.layout.viewstate.vertical_1_1.lastComponentSize = Math.round(_width / 3 * 2);
                $scope.layout.viewstate.vertical_1_2.firstComponentSize = Math.round(_width / 3);
                $scope.layout.viewstate.vertical_1_2.lastComponentSize = Math.round(_width / 3);
            }
        }

        await layout_builder();
        await $timeout();
    }

    // app editor
    $scope.app = {};
    $scope.app.preview = {};
    $scope.app.preview.status = false;
    $scope.app.preview.load = async () => {
        let url = "/dizest/ui/viewer/" + $scope.workflow_id + "/" + $scope.flow_id;
        $scope.app.preview.status = false;
        await $timeout();
        $('iframe.preview').attr('src', url);
        $('iframe.preview').on('load', async () => {
            $scope.app.preview.status = true;
            await $timeout();
        });
    }

    $scope.app.init = {};
    $scope.app.init.editor = async () => {
        $scope.app.view = 'empty';
        await $timeout();
        $scope.app.view = 'editor';
        $scope.layout.viewstate = {};
        $scope.layout.viewstate.horizonal = {};
        $scope.layout.viewstate.vertical_1_1 = {};
        $scope.layout.viewstate.vertical_1_2 = {};
        await $timeout();
        $scope.layout.change($scope.layout.active_layout);
    }

    $scope.app.load = async (app_id) => {
        if (!app_id) {
            app_id = $scope.data.app_id;
        } else {
            $scope.data.app_id = app_id;
        }

        location.href = "#" + app_id;

        let res = await wiz.API.async("load", { id: app_id });
        if (res.code == 200) {
            $scope.app.data = res.data;
            await $scope.app.init.editor();
        }
    }

    $scope.app.delete = async () => {
        if ($scope.workflow_id != 'develop') return;
        let data = angular.copy($scope.app.data);
        let res = await wiz.connect("page.hub.app.editor.modal.message")
            .data({
                title: "Delete App",
                message: "Are you sure delete `" + data.title + "` app?",
                btn_close: 'Close',
                btn_action: "Delete",
                btn_class: "btn-danger"
            })
            .event("modal-show");

        if (!res) {
            return;
        }

        res = await wiz.API.async("delete", { workflow_id: $scope.workflow_id, data: JSON.stringify(data) });
        $scope.app.data = null;
        await $timeout();

        if ($scope.app._remove) await $scope.app._remove();
    }

    $scope.app.editor = {};
    $scope.app.editor.tab = async (tab, target) => {
        $scope.app.editor.tabs[tab].status = false;
        await $timeout();

        $scope.app.editor.tabs[tab].target = target;
        if (!['preview', 'dic', 'file'].includes(target)) {
            let map = { controller: 'python', api: 'python', socketio: 'python', css: $scope.app.data.package.properties.css, html: $scope.app.data.package.properties.html, js: 'javascript' };
            $scope.app.editor.tabs[tab].monaco = monaco_option(map[target]);
        }

        $scope.app.editor.tabs[tab].status = true;
        await $timeout();

        if (target == "preview") {
            await $scope.app.preview.load();
        }

        if (target == "dic") {
            console.log($scope.app.data.dic);
        }

        if (target == "file") {
        }

    }

    $scope.app.editor.tabs = {}
    $scope.app.editor.tabs.tab1 = { status: true, target: 'controller', monaco: monaco_option('python') };
    $scope.app.editor.tabs.tab2 = { status: true, target: 'api', monaco: monaco_option('python') };
    $scope.app.editor.tabs.tab3 = { status: true, target: 'html', monaco: monaco_option('pug') };

    // viewer
    $scope.viewer = {};

    // info viewer
    $scope.viewer.info = {};
    $scope.viewer.info.show = true;
    $scope.viewer.info.toggle = async () => {
        if ($scope.viewer.info.show) {
            $scope.viewer.info.show = false;
        } else {
            $scope.viewer.info.show = true;
        }
        await $timeout();
    }

    // shortcuts
    $scope.shortcut = {};
    $scope.shortcut.configuration = (monaco) => {
        return {
            'save': {
                key: 'Ctrl KeyS',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                fn: async () => {
                    // await $scope.app.save();
                }
            },
            'clear': {
                key: 'Ctrl KeyK',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K,
                fn: async () => {
                    // await $scope.socket.clear();
                }
            }
        }
    };

    $scope.shortcut.bind = async () => {
        if (!window.monaco) return;
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
    }

    window.addEventListener("focus", $scope.shortcut.bind, false);

    // $scope.data.app = { package: { id: '', category: $scope.data.category[0].id, script_type: 'text/javascript', theme: '', controller: '' } };

    // load app
    await $scope.event.load();
    await $scope.app.load();
    await $timeout();
}