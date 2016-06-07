// newproject.js

angular.module('jade-ide').controller('NewProjectController', [
    '$scope',
    'ProjectManager',
    'UserData',
    'Messager',
    '$timeout',
    function($scope, ProjectManager, UserData, Messager, $timeout) {

    $scope.name = '';
    $scope.fileExtension = 'script';
    $scope.description = '';
    $scope.projectLanguage = 'Scratch';

    $scope.createProject = function createProject() {
        var userName = $scope.userData.login;

        ProjectManager.createProject($scope.name, $scope.description, $scope.projectLanguage)
        .then(function (result) {
            var newProject = ProjectManager.projects[userName + '/' + $scope.name];
            return ProjectManager.createProjectManifest(newProject.$project, $scope.projectLanguage)
                .then(function () {
                    return ProjectManager.createProjectReadme(newProject.$project, $scope.description, $scope.projectLanguage);
                })
                .then(function () {
                    return ProjectManager.createProjectExecutable(newProject.$project, $scope.projectLanguage);
                })
                .then(function () {
                    return ProjectManager.loadUserProjects();
                })
                .then(function () {
                    $scope.selectProject(newProject.$project);
                });
        });
    }

}]);