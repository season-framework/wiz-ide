if (!window.season) window.season = {};

window.season.shortcut = function (element, config) {
    return new (function () {
        let self = this;
        self.holdings = {};
        if (!config) config = {};

        let platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown'
        let isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(platform);
        let KEYMOD = { 'MetaLeft': 'meta', 'MetaRight': 'meta', 'OSLeft': 'meta', 'OSRight': 'meta', 'ControlLeft': 'ctrl', 'ControlRight': 'ctrl', 'AltLeft': 'alt', 'AltRight': 'alt', 'ShiftLeft': 'shift', 'ShiftRight': 'shift' };
        if (isMacLike) {
            KEYMOD = { 'MetaLeft': 'ctrl', 'MetaRight': 'ctrl', 'OSLeft': 'ctrl', 'OSRight': 'ctrl', 'ControlLeft': 'meta', 'ControlRight': 'meta', 'AltLeft': 'alt', 'AltRight': 'alt', 'ShiftLeft': 'shift', 'ShiftRight': 'shift' };
        }

        self.shortcut = {};

        self.set_shortcut = function (name, fn) {
            name = name.toLowerCase();
            name = name.split('|');
            for (let i = 0; i < name.length; i++) {
                let _name = name[i].replace(/  /gim, ' ').trim().split(' ');
                if (_name == 'default') {
                    self.shortcut[_name] = fn;
                    continue;
                }
                _name.sort();
                _name = _name.join(' ');
                self.shortcut[_name] = fn;
            }
        }

        for (let name in config) {
            self.set_shortcut(name, config[name]);
        }

        let lasttime = new Date().getTime();

        $(element).keydown(function (ev) {
            let diff = new Date().getTime() - lasttime;
            lasttime = new Date().getTime();

            if (diff > 3000) {
                self.holdings = {};    
                return;
            }

            let keycode = ev.code;
            self.holdings[keycode] = new Date().getTime();
            let ismod = KEYMOD[keycode] ? true : false;

            let keynamespace = [];
            for (let key in self.holdings) {
                if (KEYMOD[key]) {
                    keynamespace.push(KEYMOD[key].toLowerCase());
                } else {
                    keynamespace.push(key.toLowerCase());
                }
            }

            let holdings = keynamespace.length;

            keynamespace.sort();
            keynamespace = keynamespace.join(' ');
            keynamespace = keynamespace.toLowerCase();

            if (holdings > 1 && !ismod) {
                delete self.holdings[keycode];
            }

            if (self.shortcut[keynamespace]) {
                ev.preventDefault();
                self.shortcut[keynamespace](ev, keynamespace);
                ev.proceed = true;
            }

            if (self.shortcut['default']) {
                ev.preventDefault();
                self.shortcut['default'](ev, keynamespace);
            }
        });

        $(element).keyup(function (ev) {
            let keycode = ev.code;
            delete self.holdings[keycode];
        });
    });
}