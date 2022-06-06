let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.trustAsHtml = $sce.trustAsHtml;

    // shortcuts
    $scope.shortcut = {};
    $scope.shortcut.configuration = () => {
        return {
            'debug_clear': {
                key: 'Ctrl KeyK',
                desc: 'clear dubug log',
                fn: async () => {
                    await $scope.socket.clear();
                }
            }
        }
    };

    $scope.shortcut.bind = async () => {
        $(window).unbind();

        let shortcut_opts = {};
        let shortcuts = $scope.shortcut.configuration();

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

    let ansi_up = new AnsiUp();
    let socket = io("/wiz");

    $scope.socket = {};
    $scope.socket.log = "";
    $scope.socket.clear = async () => {
        $scope.socket.log = "";
        await $timeout();
    }

    socket.on("connect", async () => {
        socket.emit("join", { id: wiz.data.branch });
    });

    socket.on("log", async (data) => {
        data = ansi_up.ansi_to_html(data).replace(/\n/gim, '<br>');
        $scope.socket.log = $scope.socket.log + data;

        let logs = $scope.socket.log.split("<br>");
        let maxsize = 1000;
        if (logs.length > maxsize) {
            logs = logs.splice(logs.length - maxsize, maxsize);
            $scope.socket.log = logs.join("<br>");
        }

        await $timeout(200);
        let element = $('.debug-messages')[0];
        if (!element) return;
        element.scrollTop = element.scrollHeight - element.clientHeight;
    });
}