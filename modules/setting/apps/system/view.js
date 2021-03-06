let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.data = wiz.data.data;

    $scope.timer = (time)=> {
        let minute = Math.round(time / 60);
        if (minute == 0) return time + " sec";
        let hour = Math.round(minute / 60);
        if (hour == 0) return minute + " min";
        return hour + " hr"
    }

    $scope.kill = async()=> {
        await wiz.API.async("kill");
        location.reload();
    }

    await $timeout();
}