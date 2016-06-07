// alert.js

angular.module('jade-ide').controller('AlertController', ['$scope', 'errorObject', function($scope, errorObject) {
	$scope.errorObject = errorObject;
}]);