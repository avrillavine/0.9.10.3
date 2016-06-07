// importer.js

angular.module('jade-ide').factory('Importer', ['$rootScope', 'LogService', '$q', function($rootScope, LogService, $q) {

    function readLocalTextFile(fileEntry, readCallback, errorCallback) {
        fileEntry.file(function (file) {
            var fileReader = new FileReader();
            fileReader.onerror = function () {
                if (errorCallback) errorCallback();
            }
            fileReader.onload = function(e) {
                if (readCallback) readCallback(e.target.result);
            };

            fileReader.readAsText(file);
        });
    }

    function readLocalBinaryFile(fileEntry, readCallback, errorCallback) {
        fileEntry.file(function (file) {
            var fileReader = new FileReader();
            fileReader.onerror = function () {
                if (errorCallback) errorCallback();
            }
            fileReader.onload = function(e) {
                if (readCallback) readCallback(e.target.result);
            };

            fileReader.readAsArrayBuffer(file);
        });
    }

    function importTextFile(acceptsSpec) {
        var deferred = $q.defer();

        chrome.fileSystem.chooseEntry({"type": 'openFile', "accepts": acceptsSpec}, function (entry) {
            if (entry && entry.isFile) {
                chrome.fileSystem.getDisplayPath(entry, function (displayPath) {
                    var fileName = normalizeFilenameExtension(displayPath.replace(/^.*[\\\/]/, ''));
                    readLocalTextFile(entry, function (fileText) {
                        var file = {
                            "name": fileName,
                            "type": "text",
                            "path": displayPath,
                            "content": fileText
                        };
                        $rootScope.$evalAsync(function () {
                            deferred.resolve(file);
                        });
                    }, function () {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Import failed, failed to read file from file system");
                        });
                    });
                });
            }
            else {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Import cancelled");
                });
            }
        });

        return deferred.promise;
    }

    function importBinaryFile(acceptsSpec) {
        var deferred = $q.defer();

        chrome.fileSystem.chooseEntry({"type": 'openFile', "accepts": acceptsSpec}, function (entry) {
            if (entry && entry.isFile) {
                chrome.fileSystem.getDisplayPath(entry, function (displayPath) {
                    var fileName = normalizeFilenameExtension(displayPath.replace(/^.*[\\\/]/, ''));
                    readLocalBinaryFile(entry, function (fileArrayBuffer) {
                        var file = {
                            "name": fileName,
                            "type": "arraybuffer",
                            "path": displayPath,
                            "content": fileArrayBuffer
                        };
                        $rootScope.$evalAsync(function () {
                            deferred.resolve(file);
                        });
                    }, function () {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Import failed, failed to read file from file system");
                        });
                    });
                });
            }
            else {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Import cancelled");
                });
            }
        });

        return deferred.promise;
    }

    function importWave () {
        var accepts = [{
            // mimeTypes: ['audio/*'],
            extensions: ['wav']
        }];
        return importBinaryFile(accepts)
            .then(function (importedFile) {
                LogService.appLogMsg("Imported wave file: " + importedFile.name);
                return $q.when(importedFile);
            })
            .catch(function (reason) {
                LogService.appLogMsg("Failed to import wave file: " + reason);
                return $q.reject(reason);
            });
    }

    function importBitmap () {
        var accepts = [{
            // mimeTypes: ['image/*'],
            extensions: ['bmp']
        }];
        return importBinaryFile(accepts)
            .then(function (importedFile) {
                LogService.appLogMsg("Imported bitmap file: " + importedFile.name);
                return $q.when(importedFile);
            })
            .catch(function (reason) {
                LogService.appLogMsg("Failed to import bitmap file: " + reason);
                return $q.reject(reason);
            });
    }

    function importFunction () {
        var accepts = [{
            // mimeTypes: ['text/plain'],
            extensions: ['function']
        }];
        return importTextFile(accepts)
            .then(function (importedFile) {
                LogService.appLogMsg("Imported function file: " + importedFile.name);
                return $q.when(importedFile);
            })
            .catch(function (reason) {
                LogService.appLogMsg("Failed to import function file: " + reason);
                return $q.reject(reason);
            });
    }

    function importPanel () {
        var accepts = [{
            // mimeTypes: ['text/plain'],
            extensions: ['panel']
        }];
        return importTextFile(accepts)
            .then(function (importedFile) {
                LogService.appLogMsg("Imported panel file: " + importedFile.name);
                return $q.when(importedFile);
            })
            .catch(function (reason) {
                LogService.appLogMsg("Failed to import panel file: " + reason);
                return $q.reject(reason);
            });
    }

    function importText () {
        var accepts = [{
            // mimeTypes: ['text/plain'],
            extensions: ['txt']
        }];
        return importTextFile(accepts)
            .then(function (importedFile) {
                LogService.appLogMsg("Imported text file: " + importedFile.name);
                return $q.when(importedFile);
            })
            .catch(function (reason) {
                LogService.appLogMsg("Failed to import text file: " + reason);
                return $q.reject(reason);
            });
    }

    return{
    	importWave: importWave,
    	importBitmap: importBitmap,
    	importFunction: importFunction,
    	importPanel: importPanel,
    	importText: importText
    };

}]);