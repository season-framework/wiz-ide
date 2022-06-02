let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.hash = location.hash.split("#")[1];
    if (!$scope.hash) $scope.hash = '';
    $scope.categoires = wiz.data.category;

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

    $scope.search = {};
    $scope.event = {};

    $scope.event.load = async () => {
        let res = await wiz.API.async("list");
        $scope.data = res.data;
        $scope.data.sort((a, b) => {
            return new Date(b.package.updated).getTime() - new Date(a.package.updated).getTime()
        });

        $scope.facet = {};
        $scope.facet.category = {};

        for (let i = 0; i < $scope.data.length; i++) {
            let category = $scope.data[i].package.category;
            if (!$scope.facet.category[category]) $scope.facet.category[category] = 0;
            $scope.facet.category[category]++;
        }
        $scope.facet.count = $scope.data.length;

        await $timeout();
    }

    $scope.event.category = async (hash) => {
        location.href = location.href.split("#")[0] + "#" + hash;
        $scope.hash = hash;

        for (let i = 0; i < $scope.data.length; i++) {
            let searchindex = ['category'];
            $scope.data[i].hide = true;
            for (let j = 0; j < searchindex.length; j++) {
                try {
                    let key = searchindex[j];
                    let keyv = $scope.data[i].package[key].toLowerCase();
                    if (keyv == hash) {
                        $scope.data[i].hide = false;
                        break;
                    }
                } catch (e) {
                }
            }
            if (hash.length == 0)
                $scope.data[i].hide = false;
        }

        $scope.search.text = "";
        await $timeout();
    }

    $scope.event.search = async (val) => {
        val = val.toLowerCase();
        for (let i = 0; i < $scope.data.length; i++) {
            let searchindex = ['title', 'namespace', 'route'];
            $scope.data[i].hide = true;
            try {
                if ($scope.data[i].package.category.toLowerCase() != $scope.hash) {
                    $scope.data[i].hide = true;
                    continue;
                }
            } catch (e) {
            }


            for (let j = 0; j < searchindex.length; j++) {
                try {
                    let key = searchindex[j];
                    let keyv = $scope.data[i].package[key].toLowerCase();
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

        $timeout();
    }

    await $scope.event.load();
    await $scope.event.category($scope.hash);
}