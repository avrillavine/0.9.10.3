// readmeviewer.js

angular.module('jade-ide').controller('ReadmeViewerController', ['$scope', '$modalInstance', 'readme', '$sanitize', function($scope, $modalInstance, readme, $sanitize) {
	$scope.readme = readme;
}]);