// messager.js

var jadeIde = angular.module('jade-ide');

jadeIde.factory('Messager', ['$rootScope', function($rootScope) {
	return {

	    sendCommMessage: function sendCommMessage (msg, args) {
	        $rootScope.$broadcast('comm.' + msg, args);
	    },

	    sendEditorMessage: function sendEditorMessage (msg, args) {
	        $rootScope.$broadcast('editor.' + msg, args);
	    },

	    sendUserMessage: function sendUserMessage (msg, args) {
	        $rootScope.$broadcast('user.' + msg, args);
	    },

	    sendRobotMessage: function sendRobotMessage (msg, args) {
	        $rootScope.$broadcast('robot.' + msg, args);
	    }

	};
}])

