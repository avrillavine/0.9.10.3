// jade-ide.js

'use strict';


var jadeIde = angular.module('jade-ide', [
        'ngAnimate',
        'ngResource',
        'ngSanitize',
        'ui.bootstrap',
        'ui.bootstrap.tray',
        'ui.ace',
        'ui.blockly',
        'luegg.directives']);

jadeIde.config( [
    '$compileProvider',
    function( $compileProvider )
    {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|blob):/);
    }
]);

function appendTransform(defaults, transform) {
    defaults = angular.isArray(defaults) ? defaults : [defaults];
    return defaults.concat(transform);
}

/*
        var userToken;      // local oauth2 token reference
        var userInfo;       // local copy of Google userinfo data
        var userData;       // local copy of json data from user data in userdata server
        var userId;         // user id number ('sub' from google userdata)
*/

jadeIde.factory('userToken', function userTokenFactory () {
    return {'value': ''};
    }
);

jadeIde.controller('JadeIdeController', [
    '$scope',
    '$http',
    '$modal',
    '$window',
    '$q',
    'errorCatcher',
    'userToken',
    'UserData',
    'ProjectData',
    'GitHubAuthService',
    'ChromeBrowser',
    'Robot',
    'Builder',
    'Messager',
    'ProjectManager',
    function($scope, $http, $modal, $window, $q, errorCatcher, userToken, UserData, ProjectData, GitHubAuthService, ChromeBrowser, Robot, Builder, Messager, ProjectManager) {

    ChromeBrowser.updateCheck();
    ChromeBrowser.getPlatformInfo()
        .then(function (info) {
            $scope.platformInfo = info;
        });

    $scope.devMode = false;

    $scope.projects = {};

    $scope.init = function init () {
        $scope.auth.login(false);
    }

    $scope.isUserProject = function isUserProject(project) {
        return (project && project.projectType == 'user');
    }

    $scope.toggleDevMode = function toggleDevMode() {
        $scope.devMode = !$scope.devMode;
    }

    $scope.cloneProject = function cloneProject(project) {
        ProjectManager.cloneProject(project);
    }

    $scope.deleteProject = function deleteProject(project) {
        ProjectManager.deleteProject(project);
        //preventDefault();
    }

    $scope.returnTab = 'partials/hometext/welcome.html';

    $scope.keyPressed = function (keyEvent) {
        if (keyEvent.which === 116) { //F5
            Robot.stepIn();
        };
        if (keyEvent.which === 117) { //F6
            // Robot.stepOver();
            Robot.stepIn();
        };
        if (keyEvent.which === 118) { //F7
            // Robot.stepOut();
            Robot.stepIn();
        };
        if (keyEvent.which === 119) { //F8
            Robot.resume();
        };
        if (keyEvent.which === 27) { //ESC
            Robot.breakExecution();
        };
//        if (keyEvent.which === 121) { // F10
//            $scope.buildAndDownloadProject($scope.currentProject);
//        }
        // if (keyEvent.which === 83 && keyEvent.ctrlKey === true) {
        //     Robot.saveCurrentSession();
        // };
    }

    $scope.selectProjectByName = function selectProjectByName (projectname) {
        var projectRecord = ProjectManager.projects[projectname];
        if (projectRecord) {
            $scope.selectProject(projectRecord.$project);
        }
    }

    $scope.selectProject = function selectProject (project) {
        Messager.sendEditorMessage("closeBlockly");
        $scope.returnTab = 'partials/hometext/readme.html';
        ProjectManager.getProject(project)
            .then(function (currentProject) {
                $scope.currentProject = currentProject;
                var projectExecutable = currentProject && currentProject.$manifest && currentProject.$manifest.data && currentProject.$manifest.data.executable;
                if (projectExecutable) {
                    var execFile = currentProject[projectExecutable];
                    $scope.openProjectFile(execFile.$project, execFile.$file)
                }
                UserData.saveUserState($scope.userData.login, "lastProject", currentProject.$project.full_name);
                ProjectData.getProjectREADME(project)
                    .then(function (readmedata) {
                        currentProject['$readme'] = readmedata;
                    });
            });
    }

    $scope.clearSelectedProject = function clearSelectedProject () {
        $scope.currentProject = null;
    }

    $scope.getProjectFile = function (project, file) {
        return ProjectManager.getProjectFile(project, file);
    }

    $scope.openProjectFile = function (project, file) {
        ProjectManager.getProjectFile(project, file)
            .then(function (projectFile) {
                Messager.sendEditorMessage('open', {'projectFile': projectFile});
            })
            .catch(errorCatcher.catch('Error getting project: ' + project.full_name + ' file: ' + file.name + ' data from GitHub'));
    }

    $scope.$on('user.logout', function (project) {
        $scope.userData = null;
        $scope.userAvatar = null;
        $scope.currentProject = '/';
        $scope.returnTab = 'partials/hometext/welcome.html';
        project.projectType = 'community';
		userToken.value = null;

        ProjectManager.clearUserProjects();
		Messager.sendEditorMessage('clearAll');
    });

    $scope.$on('user.login', function () {
        $scope.userData = UserData.getUserProfile();
        $scope.returnTab = 'partials/hometext/hello.html';

        $scope.userData.$promise.then(function () {
            var userid = $scope.userData.login;

            ProjectManager.loadProjectData()
                .then(function () {
                    $scope.sampleProjects = ProjectManager.sampleProjects;
                    $scope.userProjects = ProjectManager.userProjects;
                    return UserData.getUserAccount(userid);
                })
                .then(
                    function (response) {
                        $scope.userAccountInfo = response.data;
                        if ($scope.userAccountInfo && $scope.userAccountInfo.metadata && $scope.userAccountInfo.metadata.lastProject) {
                            $scope.selectProjectByName($scope.userAccountInfo.metadata.lastProject);
                        }
                    },
                    function (response) {
                        UserData.registerUserAccount(userid);
                    }
                )
                .catch(errorCatcher.catch('Error getting user account: ' + userid));

            $http.get($scope.userData.avatar_url, {'responseType': 'blob'})
                .then(function (blob){
                    $scope.userAvatar = ($window.URL || $window.webkitURL).createObjectURL(blob.data);
                }).catch(errorCatcher.catch('Error getting avatar image from GitHub'));
        });
    });

    $scope.buildInProgress = false;
    $scope.buildAndDownloadProject = function buildAndDownloadProject (project) {
        if (!$scope.buildInProgress) {
            $scope.buildInProgress = true;
            ProjectManager.bufferProject(project)
                .then(ProjectManager.buildProject)
                .then(ProjectManager.checkRobot)
                .then(ProjectManager.transferProject)
                .then(ProjectManager.loadProject)
                .catch(errorCatcher.catch('Error during project deployment'))
                .finally(function () {
                    $scope.buildInProgress = false;
                });
        }
    }

    $scope.toggleVariablePanel = function toggleVariablePanel() {
        $scope.status.open = !$scope.status.open;
    };

    $scope.status = {
        open: false
    };

    $scope.toggleLeftPanel = function toggleLeftPanel() {
        $scope.leftdiv.open = !$scope.leftdiv.open;
    };

    $scope.leftdiv = {
        open: true
    };

    $scope.modals = {
        dashboard: {
            open: function open() {
                Robot.updateInfo();
                $scope.modals.dashboard.instance = $modal.open({
                    templateUrl: 'partials/modals/dashboard.html',
                    controller: 'DashboardController',
                    size: 'lg',
                    scope: $scope
                });
            }
        },
        newproject: {
            open: function open() {
                $scope.modals.newproject.instance = $modal.open({
                    templateUrl: 'partials/modals/newproject.html',
                    scope: $scope
                });
            }
        },
        cloneproject: {
            open: function open() {
                $scope.modals.cloneproject.instance = $modal.open({
                    templateUrl: 'partials/modals/cloneproject.html',
                    controller: 'CloneProjectController'
                });
            }
        },
        newfile: {
            open: function open() {
                $scope.modals.newfile.instance = $modal.open({
                    templateUrl: 'partials/modals/newfile.html',
                    scope: $scope
                });
            }
        },
        importfile: {
            open: function open() {
                $scope.modals.importfile.instance = $modal.open({
                    templateUrl: 'partials/modals/importfile.html',
                    scope: $scope
                });
            }
        },
        alert: {
            open: function open() {
                $scope.modals.alert.instance = $modal.open({
                    templateUrl: 'partials/modals/alert.html',
                    controller: 'AlertController'
                });
            }
        },
        deletefile: {
            open: function open(file) {
                $scope.modals.deletefile.instance = $modal.open({
                    templateUrl: 'partials/modals/deletefile.html',
                    controller: 'DeleteFileController',
                    scope: $scope,
                    resolve: {
                        file: function () {
                            return file;
                        }
                    }
                });
            }
        },
        deleteproject: {
            open: function open(project) {
                $scope.modals.deleteproject.instance = $modal.open({
                    templateUrl: 'partials/modals/deleteproject.html',
                    controller: 'DeleteProjectController',
                    scope: $scope,
                    resolve: {
                        project: function () {
                            return project;
                        }
                    }
                });
            }
        },
        githublogout: {
            open: function open() {
                $scope.modals.githublogout.instance = $modal.open({
                    templateUrl: 'partials/modals/githublogout.html',
                    controller: 'GithubLogoutController',
                    scope: $scope
                });
            }
        }
    };

    $scope.authInProgress = false;
    $scope.auth = {
        newuser: function newuser() {
            chrome.app.window.create('signup.html', {
                id: 'signupWindow',
                frame: {
                        type: 'chrome'
                },
                bounds: {
                        width: 725,
                        height: 682
                },
                state: "normal",
                resizable: false,
                hidden: true
            });
        },
        login: function login (interactive) {
            if (!$scope.authInProgress) {
                $scope.authInProgress = true;
                GitHubAuthService.getToken(interactive)
                    .then(function (token) {
                        $scope.authInProgress = false;
                        userToken.value = token;
                        $http.defaults.headers.common['Authorization'] = 'token ' + userToken.value;
                        Messager.sendUserMessage('login');
                    })
                    .catch(function (reason) {
                        $scope.authInProgress = false;
                    });
            }
        },
        logout: function logout () {
            GitHubAuthService.removeCachedToken(userToken.value);
            Messager.sendUserMessage('logout');
        }
    };

    $scope.exitApplication = function exitApplication () {
        function saveProject (result) {
            if ($scope.currentProject) {
                return ProjectManager.bufferProject($scope.currentProject);
            }
            else {
                return $q.when(result);
            }
        }

        Robot.disconnect()
            .then(saveProject, saveProject)
            .then(function (result) {
                ChromeBrowser.closeWin();
            });
    }

    $scope.titlebar = {
        minimizeWin: function minimizeWin() {
            ChromeBrowser.minimizeWin()
        },
        maximizeWin: function maximizeWin() {
            ChromeBrowser.maximizeWin()
        },
        closeWin: function closeWin() {
            $scope.exitApplication();
        },
        appVer: function appVer() {
            ChromeBrowser.appVer()
        }
    };

    $scope.userstate = {
        saveUserState: function saveUserState() {
            ChromeBrowser.saveUserState()
        },
        loadUserState: function loadUserState() {
            ChromeBrowser.loadUserState()
        }
    };

    $scope.userconfig = {
        saveUserConfig: function saveUserConfig() {
            ChromeBrowser.saveUserConfig()
        },
        loadUserConfig: function loadUserConfig() {
            ChromeBrowser.loadUserConfig()
        }
    };
}]);
