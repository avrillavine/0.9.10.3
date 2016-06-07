// vardump.js

angular.module('jade-ide').controller('VariableDumpController', ['$scope', 'Robot', 'LogService', function($scope, Robot, LogService) {

    function variableDumpNotice(noticeText) {
        var vardumpTableBody = $('#var-dump-contents');
        vardumpTableBody.empty();

        var varRow = $('<tr></tr').appendTo(vardumpTableBody);
        var varData = $('<td colspan="4" class="text-muted" align="center"></td>').appendTo(varRow);
        $('<em></em>').text(noticeText).appendTo(varData);
    }

    $scope.panelContent = "partials/variablepanel.html";
    $scope.variableDump = null;
    $scope.filesystemList = null;
    $scope.loglines = LogService.content;

    $scope.$on('robot.halted', function (event, args) {
        if ($scope.status && $scope.status.open) {
            Robot.getVariableDump().
                then(function (variableDump) {
                    $scope.variableDump = variableDump;
                });
        }

    });

    $scope.$on('robot.stepped', function (event, args) {
        if ($scope.status && $scope.status.open && $scope.panelContent == "partials/variablepanel.html") {
            Robot.getVariableDump().
                then(function (variableDump) {
                    $scope.variableDump = variableDump;
                });
        }

    });

    $scope.$on('robot.executing', function (event, args) {
    	$scope.variableDump = null;
//		variableDumpNotice("Robot busy executing script, use 'Robot -> Halt' before dumping variables");
    });

    $scope.tabs = [
        { title:'Dynamic Title 1', content:'Dynamic content 1' },
        { title:'Dynamic Title 2', content:'Dynamic content 2' },
        { title:'Dynamic Title 3', content:'Dynamic content 3' }
    ];

}]);