// importfile.js

angular.module('jade-ide').controller('ImportFileController', ['$scope', 'Importer', 'ProjectManager', function($scope, Importer, ProjectManager) {

    var importers = {
        "function": { importer: Importer.importFunction },
        "panel": { importer: Importer.importPanel },
        "txt": { importer: Importer.importText },
        "bmp": { importer: Importer.importBitmap },
        "wav": { importer: Importer.importWave }
    }

    $scope.name = "";
    $scope.loadedFile = null;
    $scope.fileExtension = 'function';
    if ($scope.currentProject && $scope.currentProject.$manifest && $scope.currentProject.$manifest.data && $scope.currentProject.$manifest.data.executable_type == 'scratch') {
        $scope.fileExtension = 'txt';
    }

    $scope.loadFile = function loadFile () {
        importers[$scope.fileExtension].importer()
            .then(function (loadedFile) {
                $scope.loadedFile = loadedFile;
                $scope.name = $scope.loadedFile.name.split('.')[0].substr(0, 8);
            })
    }

    $scope.createImportedFile = function createImportedFile() {
        var currentProject = $scope.currentProject;
        var initialcontent = ($scope.loadedFile.type == "arraybuffer") ? convertArrayBufferToString($scope.loadedFile.content) : $scope.loadedFile.content;
        ProjectManager.createFile(currentProject, $scope.name + '.' + $scope.fileExtension, initialcontent);
    }

}]);