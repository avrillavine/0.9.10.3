// errors.js

var jadeIde = angular.module('jade-ide');

jadeIde.factory('errorCatcher', ['$rootScope', '$modal', function($rootScope, $modal) {

	function errorReporter (message, reason) {
		var errorObject = {message: message, reason: reason};

		//$rootScope.addError({message: message, reason: reason});
       	console.log(errorObject);

        $modal.open(
            {
                templateUrl: 'partials/modals/alert.html',
                controller: 'AlertController',
                resolve:
                    {
                        errorObject: function () {
                            return errorObject;
                        }
                    }
            }
        );
	}

    function warningReporter (message, reason) {
        var errorObject = {message: message, reason: reason};

        //$rootScope.addError({message: message, reason: reason});
        console.log(errorObject);

        $modal.open(
            {
                templateUrl: 'partials/modals/warning.html',
                controller: 'AlertController',
                resolve:
                    {
                        errorObject: function () {
                            return errorObject;
                        }
                    }
            }
        );
    }

    return {
        catch: function (message) {
            return function (reason) {
            	errorReporter(message, reason);
            };
        },
        handle: function (message, reason) {
        	errorReporter(message, reason);
        },
        warning: function (message, reason) {
            warningReporter(message, reason);
        }
    };

}]);