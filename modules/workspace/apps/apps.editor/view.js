let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

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

    let monaco_option = (language, tab) => {
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
            tab.editor = editor;
            let shortcuts = $scope.shortcut.configuration(window.monaco);
            for (let shortcutname in shortcuts) {
                let monacokey = shortcuts[shortcutname].monaco;
                let fn = shortcuts[shortcutname].fn;
                if (!monacokey) continue;

                editor.addCommand(monacokey, async () => {
                    await fn();
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

    // data binding
    $scope.data = {};
    try {
        $scope.data.hash_id = location.hash.split("#")[1];
    } catch (e) {
        $scope.data.hash_id = '';
    }
    if (!$scope.data.hash_id) $scope.data.hash_id = 'new';

    $scope.data.category = wiz.data.category;
    $scope.data.theme = wiz.data.theme;
    $scope.data.controller = wiz.data.controller;
    $scope.data.lang = {
        html: ['pug', 'html'],
        css: ['css', 'scss', 'less']
    };
    $scope.data.sortable = { handle: '.draggable' };
    $scope.data.search = {};
    $scope.data.apps = {};

    // cache binding
    $scope.cache = {};
    $scope.cache.apps = {};
    $scope.cache.routes = {};

    // event binding
    $scope.event = {};
    $scope.event.get = {};
    $scope.event.get.app = async (app_id, refresh) => {
        if (app_id != 'new') {
            if (!refresh && $scope.cache.apps[app_id]) return $scope.cache.apps[app_id];
            let res = await wiz.API.async("load", { mode: 'app', id: app_id });
            if (res.code == 200) {
                $scope.cache.apps[app_id] = res.data;
                return $scope.cache.apps[app_id];
            }
        }
        let data = {
            package: {
                id: '',
                category: $scope.data.category[0].id,
                script_type: 'text/javascript',
                theme: '',
                controller: '',
                properties: {
                    html: 'pug', css: 'scss', js: 'javascript'
                }
            },
            api: '',
            controller: '',
            socketio: '',
            dic: {},
            html: '',
            css: '',
            js: ''
        }
        return data;
    }
    $scope.event.get.route = async (app_id, refresh) => {
        if (app_id != 'new') {
            if (!refresh && $scope.cache.routes[app_id]) return $scope.cache.routes[app_id];
            let res = await wiz.API.async("load", { mode: 'app', id: app_id });
            if (res.code == 200) {
                $scope.cache.routes[app_id] = res.data;
                return $scope.cache.routes[app_id];
            }
        }
        let data = {
            package: {
                id: '',
                category: $scope.data.category[0].id,
                script_type: 'text/javascript',
                theme: '',
                controller: '',
                properties: {
                    html: 'pug', css: 'scss', js: 'javascript'
                }
            },
            api: '',
            controller: '',
            socketio: '',
            dic: {},
            html: '',
            css: '',
            js: ''
        }
        return data;
    }


    $scope.event.load = async (mode) => {
        if (!mode) mode = $scope.viewer.list.mode;
        let res = await wiz.API.async("list", { mode: mode });
        let data = res.data;
        data.sort((a, b) => {
            return a.package.id.localeCompare(b.package.id);
        });

        if (mode == 'app') {
            $scope.data.apps = {};
            for (let i = 0; i < data.length; i++) {
                let category = data[i].package.category;
                if (!$scope.data.apps[category]) $scope.data.apps[category] = [];
                $scope.data.apps[category].push(data[i]);
            }
        }

        if (mode == 'route') {
            $scope.data.routes = [];
            for (let i = 0; i < data.length; i++) {
                $scope.data.routes.push(data[i]);
            }
        }

        await $timeout();
    }

    $scope.event.delete = async () => {
        let mode = $scope.viewer.tabs.active_tab.mode;
        let data = angular.copy($scope.viewer.tabs.active_tab.data);

        let message = "Are you sure delete?"
        if (mode == 'app') {
            message = "Are you sure delete `" + data.package.title + "` app?";
        }

        let res = await wiz.connect("modal.message")
            .data({
                title: "Delete",
                message: message,
                btn_close: 'Close',
                btn_action: "Delete",
                btn_class: "btn-danger"
            })
            .event("modal-show");
        if (!res) return;

        if (mode == 'app') {
            res = await wiz.API.async("app_delete", { app_id: data.package.id });

            let removes = [];
            for (let i = 0; i < $scope.viewer.tabs.data.length; i++) {
                if ($scope.viewer.tabs.data[i].org_app_id == data.package.id) {
                    removes.push($scope.viewer.tabs.data[i]);
                }
            }
            for (let i = 0; i < removes.length; i++) {
                $scope.viewer.tabs.data.remove(removes[i]);
            }

            if ($scope.viewer.tabs.data.length > 0) {
                await $scope.viewer.tabs.data[0].activate();
            } else {
                $scope.viewer.tabs.active_tab = null;
            }

            await $scope.event.load('app');
        }

        await $timeout();
    }


    $scope.event.save = async () => {
        let mode = $scope.viewer.tabs.active_tab.mode;
        let data = angular.copy($scope.viewer.tabs.active_tab.data);

        if (mode == 'app') {
            let is_new = $scope.viewer.tabs.active_tab.new;
            let org_app_id = $scope.viewer.tabs.active_tab.org_app_id;

            if (is_new) {
                let res = await wiz.API.async("app_create", { app_id: data.package.id, data: JSON.stringify(data) });
                if (res.code != 200)
                    return alert(res.data);
                $scope.viewer.tabs.active_tab.org_app_id = data.package.id;
                $scope.viewer.tabs.active_tab.app_id = data.package.id;
                delete $scope.viewer.tabs.active_tab.new;
                $scope.cache.apps[data.package.id] = $scope.viewer.tabs.active_tab.data;
                await $scope.event.load('app');
            } else {
                if (data.package.id != org_app_id) {
                    let res = await wiz.API.async("app_rename", { app_id: org_app_id, rename: data.package.id });
                    if (res.code != 200)
                        return alert(res.data);

                    for (let i = 0; i < $scope.viewer.tabs.data.length; i++) {
                        if ($scope.viewer.tabs.data[i].org_app_id == org_app_id) {
                            $scope.viewer.tabs.data[i].org_app_id = data.package.id;
                            $scope.viewer.tabs.data[i].app_id = data.package.id;
                        }
                    }
                }
                let res = await wiz.API.async("app_update", { app_id: data.package.id, data: JSON.stringify(data) });
                if (res.code != 200)
                    return alert(res.data);
                await $scope.event.load('app');
            }
        }

        await $timeout();
    }

    $scope.event.search = async (val) => {
        val = val.toLowerCase();
        let searchindex = ['title', 'id', 'route'];
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
        await $timeout();
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

    // viewer
    $scope.viewer = {};

    $scope.viewer.list = (function () {
        let obj = {};
        let initialize = $scope.data.hash_id.split("/");
        let mode = 'app';
        if (initialize[0]) mode = initialize[0];
        obj.mode = mode;
        obj.show = true;
        obj.toggle = async () => {
            if (obj.show) {
                obj.show = false;
            } else {
                obj.show = true;
            }
            await $timeout();
        }
        return obj;
    })();

    $scope.viewer.info = (function () {
        let obj = {};
        obj.show = true;
        obj.toggle = async () => {
            if (obj.show) {
                obj.show = false;
            } else {
                obj.show = true;
            }
            await $timeout();
        }
        return obj;
    })();

    $scope.viewer.debug = (function () {
        let obj = {};
        obj.show = false;
        obj.toggle = async () => {
            if (obj.show) {
                obj.show = false;
            } else {
                obj.show = true;
            }
            await $timeout();
        }
        return obj;
    })();

    let tab_generator = {};
    tab_generator.app = async (app_id, target) => {
        let obj = {};
        obj.id = 'editor-' + new Date().getTime();
        obj.mode = 'app';
        obj.data = await $scope.event.get.app(app_id);
        obj.app_id = obj.data.package.id;
        obj.org_app_id = obj.data.package.id + '';

        if (obj.app_id === '') {
            obj.new = true;
        }

        obj.activate = async () => {
            while (!obj.editor) await $timeout(100);
            obj.editor.focus();
            $scope.viewer.tabs.active_tab = obj;
            $scope.data.hash_id = 'app/' + obj.app_id;
            location.href = "#" + $scope.data.hash_id;
            await $timeout();
        }

        obj.code = {};
        obj.code.list = ['controller', 'api', 'socketio', 'html', 'js', 'css', 'dic', 'preview'];
        obj.code.select = async (target) => {
            obj.show = false;
            await $timeout();
            obj.code.target = target;

            if (target == 'dic') {

            } else if (target == 'preview') {

            } else {
                let map = { controller: 'python', api: 'python', socketio: 'python', css: obj.data.package.properties.css, html: obj.data.package.properties.html, js: 'javascript' };
                obj.show = true;
                obj.monaco = monaco_option(map[target], obj);
            }

            await $timeout();
        }

        if (!target) target = 'controller';
        obj.code.select(target);
        return obj;
    }

    $scope.viewer.tabs = await (async () => {
        let obj = {};

        obj.init = async () => {
            obj.active_tab = null;
            obj.data = [];

            let initialize = $scope.data.hash_id.split("/");
            let mode = 'app';
            let app_id = 'new'
            if (initialize[0]) mode = initialize[0];
            if (initialize[1]) app_id = initialize[1];

            if (mode == 'app') {
                let tab = await tab_generator.app(app_id, 'controller');
                if (tab) {
                    obj.data.push(tab);
                    await tab.activate();
                }

                if (tab.app_id != '') {
                    tab = await tab_generator.app(app_id, 'api');
                    if (tab) obj.data.push(tab);
                }
            }
        }

        obj.add = async (mode, target, location) => {
            let tab = null;
            if (mode == 'app') {
                tab = await tab_generator.app(target, 'controller');
            }

            if (tab) {
                if (location) {
                    obj.data.splice(location, 0, tab);
                } else {
                    obj.data.push(tab);
                }
            }

            await $timeout();

            if (tab && tab.activate)
                await tab.activate();
        }

        obj.remove = async (tab) => {
            let tabidx = obj.data.indexOf(tab);
            obj.data.remove(tab);

            if (tab.mode == 'app') {
                let deleted = tab.app_id;
                for (let i = 0; i < obj.data.length; i++) {
                    if (obj.data[i].mode != 'app') continue;
                    if (obj.data[i].app_id == deleted) {
                        deleted = null;
                    }
                }
                delete $scope.cache.apps[deleted];

                if (obj.active_tab.id == tab.id) {
                    obj.active_tab = null;
                    if (obj.data.length > 0) {
                        if (obj.data[tabidx]) {
                            await obj.data[tabidx].activate();
                        } else {
                            await obj.data[obj.data.length - 1].activate();
                        }
                    }
                }
            }

            await $timeout();
        }

        return obj;
    })();

    // shortcuts
    $scope.shortcut = {};
    $scope.shortcut.configuration = (monaco) => {
        return {
            'tab1': {
                key: 'Alt Digit1',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.DIGIT1,
                fn: async () => {
                    if ($scope.viewer.tabs.data[0])
                        await $scope.viewer.tabs.data[0].activate();
                    await $timeout();
                }
            },
            'tab2': {
                key: 'Alt Digit2',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.DIGIT2,
                fn: async () => {
                    if ($scope.viewer.tabs.data[1])
                        await $scope.viewer.tabs.data[1].activate();
                    await $timeout();
                }
            },
            'tab3': {
                key: 'Alt Digit3',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.DIGIT3,
                fn: async () => {
                    if ($scope.viewer.tabs.data[2])
                        await $scope.viewer.tabs.data[2].activate();
                    await $timeout();
                }
            },
            'tab4': {
                key: 'Alt Digit4',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.DIGIT4,
                fn: async () => {
                    if ($scope.viewer.tabs.data[3])
                        await $scope.viewer.tabs.data[3].activate();
                    await $timeout();
                }
            },
            'tab5': {
                key: 'Alt Digit5',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.DIGIT5,
                fn: async () => {
                    if ($scope.viewer.tabs.data[4])
                        await $scope.viewer.tabs.data[4].activate();
                    await $timeout();
                }
            },

            'code_prev': {
                key: 'Alt KeyA',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.KEY_A,
                fn: async () => {
                    if (!$scope.viewer.tabs.active_tab) return;
                    if (!$scope.viewer.tabs.active_tab.code) return;
                    if (!$scope.viewer.tabs.active_tab.code.list) return;
                    let targets = angular.copy($scope.viewer.tabs.active_tab.code.list);
                    let target = $scope.viewer.tabs.active_tab.code.target;
                    let target_idx = targets.indexOf(target);

                    target_idx = target_idx - 1;
                    if (target_idx < 0) target_idx = targets.length - 1;

                    let newtarget = targets[target_idx];
                    await $scope.viewer.tabs.active_tab.code.select(newtarget);
                    $scope.viewer.tabs.active_tab.editor.focus();

                    await $timeout();
                }
            },
            'code_next': {
                key: 'Alt KeyS',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.KEY_S,
                fn: async () => {
                    if (!$scope.viewer.tabs.active_tab) return;
                    if (!$scope.viewer.tabs.active_tab.code) return;
                    if (!$scope.viewer.tabs.active_tab.code.list) return;
                    let targets = angular.copy($scope.viewer.tabs.active_tab.code.list);
                    let target = $scope.viewer.tabs.active_tab.code.target;
                    let target_idx = targets.indexOf(target);

                    target_idx = target_idx + 1;
                    if (target_idx >= targets.length) target_idx = 0;

                    let newtarget = targets[target_idx];
                    await $scope.viewer.tabs.active_tab.code.select(newtarget);
                    $scope.viewer.tabs.active_tab.editor.focus();

                    await $timeout();
                }
            },

            'new_tab': {
                key: 'Alt KeyT',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.KEY_T,
                fn: async () => {
                    if (!$scope.viewer.tabs.active_tab) return;
                    if ($scope.viewer.tabs.active_tab.mode == 'app') {
                        let targetidx = $scope.viewer.tabs.data.indexOf($scope.viewer.tabs.active_tab);
                        $scope.viewer.tabs.add('app', $scope.viewer.tabs.active_tab.app_id, targetidx + 1);
                    }

                    await $timeout();
                }
            },

            'close_tab': {
                key: 'Alt KeyW',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.KEY_W,
                fn: async () => {
                    if ($scope.viewer.tabs.active_tab)
                        $scope.viewer.tabs.remove($scope.viewer.tabs.active_tab);
                    await $timeout();
                }
            },

            'new': {
                key: 'Alt KeyN',
                monaco: monaco.KeyMod.Alt | monaco.KeyCode.KEY_N,
                fn: async () => {
                    await $scope.viewer.tabs.add('app', 'new');
                    await $timeout();
                }
            },

            'debug': {
                key: 'Ctrl KeyJ',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_J,
                fn: async () => {
                    await $scope.viewer.debug.toggle();
                }
            },
            'info': {
                key: 'Ctrl KeyI',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I,
                fn: async () => {
                    await $scope.viewer.info.toggle();
                }
            },
            'save': {
                key: 'Ctrl KeyS',
                monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                fn: async () => {
                    await $scope.event.save();
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

    // load app
    await $scope.event.load();
    await $scope.viewer.tabs.init();
    await $timeout();

    // bind shortcut
    while (!window.monaco) {
        await $timeout(100);
    }

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

        season.shortcut(window, shortcut_opts);
    }

    await $scope.shortcut.bind();

}