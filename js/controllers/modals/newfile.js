// newfile.js

angular.module('jade-ide').controller('NewFileController', ['$scope', 'ProjectManager', function($scope, ProjectManager) {

    $scope.name = '';
    $scope.fileExtension = 'function';

    if ($scope.currentProject && $scope.currentProject.$manifest && $scope.currentProject.$manifest.data && $scope.currentProject.$manifest.data.executable_type == 'scratch') {
        $scope.fileExtension = 'txt';
    }

    $scope.createFile = function createFile() {
        var currentProject = $scope.currentProject;
        ProjectManager.createFile(currentProject, $scope.name + '.' + $scope.fileExtension, '');
    }

}]);