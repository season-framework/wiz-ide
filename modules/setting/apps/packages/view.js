let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.pip = {};
    $scope.pip.install_status = false;

    $scope.pip.load = async () => {
        let res = await wiz.API.async("installed");
        $scope.pip.data = res.data;
        $scope.pip.data.sort((a, b) => a.name.localeCompare(b.name));
        await $timeout();
    }

    $scope.pip.install = async (packages) => {
        if (!packages) return;
        if ($scope.pip.install_status) return;
        $scope.pip.install_message = null;
        $scope.pip.install_status = true;
        await $timeout();
        let res = await wiz.API.async("install", { package: packages });
        $scope.pip.install_message = res.data;
        $scope.pip.install_status = false;
        $scope.packages = "";
        await $timeout();
        $('#offcanvas-result').offcanvas('show');
        await $scope.pip.load();
    }

    $scope.pip.search = async (val) => {
        val = val.toLowerCase();
        for (var i = 0; i < $scope.pip.data.length; i++) {
            let searchindex = ['name'];
            $scope.pip.data[i].hide = true;
            for (let j = 0; j < searchindex.length; j++) {
                try {
                    let key = searchindex[j];
                    let keyv = $scope.pip.data[i][key].toLowerCase();
                    if (keyv.includes(val)) {
                        $scope.pip.data[i].hide = false;
                        break;
                    }
                } catch (e) {
                }
            }
            if (val.length == 0)
                $scope.pip.data[i].hide = false;
        }

        await $timeout();
    }

    await $scope.pip.load();
}
