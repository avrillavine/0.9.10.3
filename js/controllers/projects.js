// projects.js

angular.module('jade-ide').controller('ProjectsController', ['$scope', '$timeout', function($scope, $timeout) {

    var buildLock = false;

    // $scope.hoverIn = function(){
    //     var delayTimer = $timeout(function(){
    //         $scope.modals.tooltip.open()
    //     }, 1000)

    //     $scope.stop = function() {
    //         $timeout.cancel(delayTimer)
    //     }
    // };

    // $scope.hoverOut = function(){
    //     var delayTimer = $timeout(function(){
    //         $scope.modals.tooltip.instance.close();
    //     }, 0)

    //     $scope.stop = function() {
    //         $timeout.cancel(delayTimer)
    //     }
    // };

    $scope.tooltip = function(project){
        $scope.dynamicPopover = "" + project.description;    
        $scope.dynamicPopoverTitle = "" + project.name;
    }

	$scope.find = function () {
		$scope.projects = {};
	}

    $scope.cats = {
        entry: true,
        panels: true,
        bitmaps: true,
        wave: true,
        dropdownCommunity: true,
        dropdownUser: false
    };

    $scope.nonExecutableJadeProject = function(query) {
        return function(projectname, project) {
            return (project && project.$manifest && project.$manifest.data && project.$manifest.data.executable);
        }
    }

}]);