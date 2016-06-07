

angular.module('jade-ide').controller('DeleteProjectController', ['$scope', 'project', 'ProjectManager', 'Messager', 'UserData', function($scope, project, ProjectManager, Messager, UserData) {

    $scope.proj = project;

    $scope.deleteProject = function deleteProject() {
        ProjectManager.deleteProj($scope.currentProject.$project)
        	.then(function () {
        		$scope.clearSelectedProject();
        		return ProjectManager.loadUserProjects();
        	});
    }

}]);