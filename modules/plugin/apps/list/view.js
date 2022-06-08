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

    $scope.link = async (link) => {
        location.href = link;
    }

    $scope.datedisplay = function (date) {
        let targetdate = moment(date);
        let diff = new Date().getTime() - new Date(targetdate).getTime();
        diff = diff / 1000 / 60 / 60;

        if (diff > 24) return targetdate.format("YYYY-MM-DD hh:mm");
        if (diff > 1) return Math.floor(diff) + " hours ago"

        diff = diff * 60;

        if (diff < 2) return "just now";

        return Math.floor(diff) + " minutes ago";
    }

    $scope.event = {};

    $scope.event.load = async () => {
        let res = await wiz.API.async("list");
        $scope.data = res.data;

        $scope.data.sort((a, b) => {
            let comp = 0;
            comp = a.name.localeCompare(b.name);
            return comp;
        });

        console.log($scope.data);

        await $timeout();
    }

    $scope.event.search = async (val) => {
        val = val.toLowerCase();
        for (var i = 0; i < $scope.data.length; i++) {
            let searchindex = ['name', 'id'];
            $scope.data[i].hide = true;
            for (let j = 0; j < searchindex.length; j++) {
                try {
                    let key = searchindex[j];
                    let keyv = $scope.data[i][key].toLowerCase();
                    if (keyv.includes(val)) {
                        $scope.data[i].hide = false;
                        break;
                    }
                } catch (e) {
                }
            }
            if (val.length == 0)
                $scope.data[i].hide = false;
        }

        await $timeout();
    }

    $scope.event.new = async (baseurl, text) => {
        if (!text) text = "";
        if (!(/^[a-zA-Z0-9()]+$/.test(text)) || text.length < 3) {
            alert("Doesn't match the plugin's id rules");
            return;
        }
        location.href = baseurl + text + "#route/new";
    }

    await $scope.event.load();
}