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

    $scope.link = async (url) => {
        location.href = url;
    }

    $scope.loader = (() => {
        let obj = {};
        obj.display = true;
        obj.show = async () => {
            obj.display = true;
            await $timeout()
        }
        obj.hide = async () => {
            obj.display = false;
            await $timeout()
        }
        return obj;
    })();

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

    $scope.data = {};
    $scope.data.create = {};
    $scope.data.commit_page = {};

    $scope.branch = wiz.data.branch;

    $scope.event = {};
    $scope.event.load = async () => {
        let res = await wiz.API.async("branches");
        $scope.data.active = res.data.active;
        $scope.data.active.sort((a, b) => {
            if (a.name == 'master' || a.name == 'main') return -1;
        });

        $scope.data.stale = res.data.stale;
        $scope.data.stale.sort((a, b) => {
            if (a.name == 'master' || a.name == 'main') return -1;
        });
        $scope.data.prlist = res.data.pr;
        await $scope.loader.hide();
        await $timeout();
    }

    $scope.event.commits = async (item, page) => {
        if (!page) page = 1;
        if (page === 1 && item.commits && item.commits.length > 0) {
            item.commits = [];
            item.commits_end = false;
        } else {
            let res = await wiz.API.async("commits", { branch: item.name, page: page });
            if (res.code == 200) {
                if (!item.commits) item.commits = [];
                if (res.data.length != 5) item.commits_end = true;
                for (let i = 0; i < res.data.length; i++) {
                    item.commits.push(res.data[i]);
                }
                $scope.data.commit_page[item.name] = page;
            }
        }
        await $timeout();
    }

    $scope.event.create = async () => {
        $scope.data.create = {};
        $scope.data.create.base = $scope.branch + '';
        $scope.data.create.branch = '';
        $scope.data.create.author_name = 'wiz';
        $scope.data.create.author_email = 'wiz@localhost';
        await $timeout();
        $('#offcanvas-create-branch').offcanvas('show');
    }

    $scope.event.create_branch = async () => {
        await $scope.loader.show();
        let data = angular.copy($scope.data.create);
        let res = await wiz.API.async("create", data);
        await $scope.loader.hide();

        if (res.code != 200) {
            alert(res.data);
        }

        $('#offcanvas-create-branch').offcanvas('hide');
        await $scope.event.load();
        await $timeout();
    }

    $scope.event.archive = async (branch) => {
        await $scope.loader.show();
        let res = await wiz.API.async("archive", { branch: branch });
        await $scope.loader.hide();

        if (res.code != 200) {
            alert(res.data);
        }

        await $scope.event.load();
        await $timeout();
    }

    $scope.event.delete = async (branch) => {
        await $scope.loader.show();
        let res = await wiz.API.async("delete", { branch: branch });
        await $scope.loader.hide();

        if (res.code != 200) {
            alert(res.data);
        }

        await $scope.event.load();
        await $timeout();
    }

    $scope.event.restore = async (branch) => {
        await $scope.loader.show();
        let res = await wiz.API.async("restore", { branch: branch });
        await $scope.loader.hide();

        if (res.code != 200) {
            alert(res.data);
        }

        await $scope.event.load();
        await $timeout();
    }

    $scope.event.author = {};
    $scope.event.author.offcanvas = async (item) => {
        $scope.data.author = { branch: item.name, name: item.author.name, email: item.author.email };
        await $timeout();
        $('#offcanvas-author').offcanvas('show');
    }

    $scope.event.author.update = async () => {
        let data = angular.copy($scope.data.author);
        await wiz.API.async('update_author', data);
        await $scope.event.load();
        await $timeout();
        $('#offcanvas-author').offcanvas('hide');
    }


    $scope.event.pr = {};
    $scope.event.pr.offcanvas = async (item) => {
        $scope.data.pr = { source: item.name, name: item.author.name, email: item.author.email };
        await $timeout();
        $('#offcanvas-pr').offcanvas('show');
    }

    $scope.event.pr.request = async () => {
        let data = angular.copy($scope.data.pr);
        await $scope.loader.show();
        let res = await wiz.API.async('pr_request', data);
        await $scope.loader.hide();
        if (res.code != 200) {
            await alert(res.data);
            return;
        }
        await $scope.event.load();
        await $timeout();
        $('#offcanvas-pr').offcanvas('hide');
    }

    $scope.event.pr.delete = async (item) => {
        let data = angular.copy(item);
        await $scope.loader.show();
        let res = await wiz.API.async('pr_delete', data);
        await $scope.loader.hide();
        if (res.code != 200) {
            await alert(res.data);
            return;
        }
        await $scope.event.load();
        await $timeout();
        $('#offcanvas-pr').offcanvas('hide');
    }

    $scope.event.clean = async () => {
        await $scope.loader.show();
        try {
            await wiz.API.async('clean');
        } catch (e) {
        }
        location.reload();
    }

    await $scope.event.load();
}