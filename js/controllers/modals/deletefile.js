// deletefile.js

angular.module('jade-ide').controller('DeleteFileController', ['$scope', 'file', 'ProjectManager', 'Messager', 'UserData', function($scope, file, ProjectManager, Messager, UserData) {

    $scope.deletefileonproject = false;
    $scope.deletefileonrobot = false;

    $scope.noneselected = function() {
      return (!deletefileonproject && !deletefileonrobot);
    }

    $scope.file = file;

    $scope.deleteFile = function deleteFile() {
        var userName = $scope.userData.login;
        var targetProject = ProjectManager.projects[userName + '/' + $scope.currentProject.$project.name];

        ProjectManager.loadProjectData();
        ProjectManager.deleteProjectFile($scope.currentProject.$project, $scope.file);
        Messager.sendEditorMessage('closeTab', {'name': $scope.file.name});
        ProjectManager.getProject($scope.currentProject.$project);
    }

}]);