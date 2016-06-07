// browserservices.js

var jadeIde = angular.module('jade-ide');

jadeIde.factory('ChromeBrowser', ['$q', '$rootScope', 'LogService', '$modal', function($q, $rootScope, LogService, $modal) {
    // user state data sync'd using chrome.storage
    var userState = {}
    // local user config data persisted using chrome.storage
    var userConfig = {}

    chrome.runtime.onUpdateAvailable.addListener(function () {
        $rootScope.$evalAsync(function () {
            var updateReadyModal = $modal.open({
                templateUrl: 'partials/modals/updaterestart.html'
            });
            updateReadyModal.result.then(function () {
                chrome.runtime.reload();
            })
        });
    });

    return {
        updateCheck: function updateCheck () {
            chrome.runtime.requestUpdateCheck(function (status) {
                LogService.appLogMsg('Check for application update: ' + status);
            });
        },

        getPlatformInfo: function getPlatformInfo () {
            var deferred = $q.defer();
            chrome.runtime.getPlatformInfo(function (info) {
                $rootScope.$evalAsync(function () {
                    LogService.appLogMsg('Retrieved platform info:\n' + JSON.stringify(info, null, 2));
                    deferred.resolve(info);
                });
            });

            return deferred.promise;
        },

        minimizeWin: function minimizeWin () {
            var currentWindow = chrome.app.window.current();
            currentWindow.minimize();
        },

        maximizeWin: function maximizeWin () {
            var currentWindow = chrome.app.window.current();
            if (currentWindow.isMaximized()) {
                currentWindow.restore();
            }
            else {
                currentWindow.maximize();
            }
        },

        closeWin: function closeWin () {
            window.close();
        },

        appVer: function appVer () {
            var appVersion = chrome.runtime.getManifest().version;
            return appVersion
        },

        saveLocalStorage: function saveLocalStorage (key, value) {
            var deferred = $q.defer();
            var newItem = {};
            newItem[key] = value;
            chrome.storage.local.set(newItem,
                function () {
                    var lastError = chrome.runtime.lastError;
                    if (lastError) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject(lastError.message);
                        });
                    }
                    else {
                        $rootScope.$evalAsync(function () {
                            deferred.resolve();
                        });
                    }
                });
            return deferred.promise;
        },

        loadLocalStorage: function loadLocalStorage (key) {
            var deferred = $q.defer();

            chrome.storage.local.get(key,
                function (storedValue) {
                    var lastError = chrome.runtime.lastError;
                    if (lastError) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject(lastError.message);
                        });
                    }
                    else {
                        $rootScope.$evalAsync(function () {
                            deferred.resolve(storedValue[key]);
                        });
                    }
                });

            return deferred.promise;
        }

    }; // return

}]); // factory
