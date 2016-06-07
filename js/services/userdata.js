// userdata.js

var userdataBaseURL = 'https://userdata.cloud.mimetics.ca/api/v1';

var jadeIde = angular.module('jade-ide');

jadeIde.factory('UserProfile', ['$resource', function($resource) {
    return $resource('https://api.github.com/user', {},
        {   'get':    {method:'GET'}
        }
    );
}]);

jadeIde.factory('UserData', ['$http', 'UserProfile', function ($http, UserProfile) {

    function createUser(successCallback, errorCallback) {
        var requestURL = userdataBaseURL + '/user/' + userId;
        authPUTText(requestURL, '', function () {
            if (successCallback) successCallback();
        }, function () {
            if (errorCallback) errorCallback();
        })
    }

    function getUserData(successCallback, errorCallback) {
        var requestURL = userdataBaseURL + '/user/' + userId;
        authGETJSON(requestURL, function (data) {
            userData = data;
            if (successCallback) successCallback();
        }, function (xhr, textStatus, errorThrown) {
            var code = null;
            if (xhr) {
                code = xhr.status;
            } 
            if (errorCallback) errorCallback(code);            
        });
    }

    function createProject(projectName, successCallback, errorCallback) {
        authPUTText(userdataBaseURL + '/user/' + userId + '/project/' + projectName, '', function () {
            if (successCallback) successCallback();
        }, function () {
            if (errorCallback) errorCallback();
        });
    }

    function getProjects(successCallback, errorCallback) {
        authGETJSON(userdataBaseURL + '/user/' + userId, function (data) {
            var projectList = data.projects;
            successCallback(projectList);
        }, errorCallback);
    }

    function readTextFile(fileName, successCallback, errorCallback) {
        var projectName = userState.currentProject;
        var requestURL = userdataBaseURL + '/user/' + userId + '/project/' + projectName + '/file/' + fileName + '/text';
        authGETText(requestURL, function(text) {
            successCallback(text);
        }, function () {
            if (errorCallback) errorCallback();
        });
    }

    function readBinaryFile(fileName, successCallback, errorCallback) {
        var projectName = userState.currentProject;
        var requestURL = userdataBaseURL + '/user/' + userId + '/project/' + projectName + '/file/' + fileName + '/data';
        authGETBinary(requestURL, function(data) {
            successCallback(data);
        }, function () {
            if (errorCallback) errorCallback();
        });
    }

    function writeTextFile(fileName, fileData, successCallback, errorCallback) {
        var projectName = userState.currentProject;
        authPUTText(userdataBaseURL + '/user/' + userId + '/project/' + projectName + '/file/' + fileName, fileData, successCallback, errorCallback);
    }

    function writeBinaryFile(fileName, fileData, successCallback, errorCallback) {
        var projectName = userState.currentProject;
        var requestURL = userdataBaseURL + '/user/' + userId + '/project/' + projectName + '/file/' + fileName;
        authPUTBinary(requestURL, fileData, successCallback, errorCallback);
    }

    function getFiles(successCallback, errorCallback) {
        var projectName = userState.currentProject;
        authGETJSON(userdataBaseURL + '/user/' + userId + '/project/' + projectName, function (data) {
            var fileList = data.files;
            successCallback(fileList);
        }, errorCallback);
    }

    function deleteFile(fileName, successCallback, errorCallback) {
        var projectName = userState.currentProject;
        var requestURL = userdataBaseURL + '/user/' + userId + '/project/' + projectName + '/file/' + fileName;
        authDELETE(requestURL, successCallback, errorCallback);
    }

    return {
        getClientVersionInfo: function getClientVersionInfo () {
            return $http({method:'GET', url: userdataBaseURL + '/clientversion/jade-support'});
        },
        getUserProfile: function getUserProfile () {
            return UserProfile.get();
        },
        getUserAccount: function getUserAccount (userid) {
            return $http({method:'GET', url: userdataBaseURL + '/user/' + userid});
        },
        registerUserAccount: function registerUserAccount (userid) {
            return $http({method:'PUT', url: userdataBaseURL + '/user/' + userid});
        },
        saveUserState: function saveUserState (userid, statekey, statevalue) {
            var state = {};
            state[statekey] = statevalue;
            return $http({method:'POST', url: userdataBaseURL + '/user/' + userid, data: state});
        }
    };

}]);