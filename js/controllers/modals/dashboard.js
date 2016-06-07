// dashboard.js

angular.module('jade-ide').controller('DashboardController', [
    '$scope',
    'ChromeBrowser',
    'TokenizerService',
    'XmlProcessor',
    'PanelProcessor',
    'BitmapProcessor',
    'WaveProcessor',
    'TextProcessor',
    'Robot',
    function($scope, ChromeBrowser, TokenizerService, XmlProcessor, PanelProcessor, BitmapProcessor, WaveProcessor, TextProcessor, Robot) {

    $scope.appVersion = ChromeBrowser.appVer();
    $scope.robot = Robot;

    $scope.getVersions = function () {
        TokenizerService.version().success(
            function (response) {
                $scope.tokenizerVersion = response;
            });
        TokenizerService.syscallVersion().success(
            function (response) {
                $scope.syscallVersion = response;
            });
        XmlProcessor.version().success(
            function (response) {
                $scope.xmlProcessorVersion = response;
            });
        PanelProcessor.version().success(
            function (response) {
                $scope.panelProcessorVersion = response;
            });
        BitmapProcessor.version().success(
            function (response) {
                $scope.bitmapProcessorVersion = response;
            });
        WaveProcessor.version().success(
            function (response) {
                $scope.waveProcessorVersion = response;
            });
        TextProcessor.version().success(
            function (response) {
                $scope.textProcessorVersion = response;
            });
    }

    function filesystemListNotice(noticeText) {
        var fsTableBody = $('#robot-fs-contents');
        fsTableBody.empty();

        var fileRow = $('<tr></tr').appendTo(fsTableBody);
        var fileData = $('<td colspan="4" class="text-muted" align="center"></td>').appendTo(fileRow);
        $('<em></em>').text(noticeText).appendTo(fileData);
    }

    function updateRobotFilesystemList(files, overrideShowHiddenFiles) {
        var showHiddenFiles = (overrideShowHiddenFiles || userConfig.showHiddenFiles);

        var fsTableBody = $('#robot-fs-contents');
        fsTableBody.empty();

        Object.keys(files).forEach(function (filename) {
            var file = files[filename];
            if (showHiddenFiles || !file.hidden) {
                var fileRow = $('<tr></tr').appendTo(fsTableBody);

                $('<td></td>', {
                    'html': $('<a class="robotfilelnk" href="robotfile/' + filename + '"></a>').text(file.name)
                }).appendTo(fileRow);
                $('<td></td>').text(file.type).appendTo(fileRow)
                $('<td></td>').text(file.size).appendTo(fileRow)
                $('<td></td>').text(file.checksum).appendTo(fileRow)                    
            }
        });

    }

    $("#robot-fs").on("click", ".robotfilelnk", function (e) {
        e.preventDefault();
        return;
    });

    $("#menu-help-about")
        .click(function() {
            $("#aboutModal").modal('show');
        });

    function setupAboutFields() {
        var tokenizerVersionURL = tokenizerBaseURL + '/TokenizerService?version';
        var syscallVersionURL = tokenizerBaseURL + '/TokenizerService?syscallVersion';
        var pnlProcessorVersionURL = tokenizerBaseURL + '/PnlProcessor?version';
        var wavProcessorVersionURL = tokenizerBaseURL + '/WavProcessor?version';
        var bmpProcessorVersionURL = tokenizerBaseURL + '/BmpProcessor?version';

        $("#about-version").empty().text(appVersion);
        $.get(tokenizerVersionURL, function (data) {
            $("#about-tok-ver").empty().text(data);
        });
        $.get(pnlProcessorVersionURL, function (data) {
            $("#about-pnl-ver").empty().text(data);
        });
        $.get(bmpProcessorVersionURL, function (data) {
            $("#about-bmp-ver").empty().text(data);
        });
        $.get(wavProcessorVersionURL, function (data) {
            $("#about-wav-ver").empty().text(data);
        });
        $.get(syscallVersionURL, function (data) {
            $("#about-sys-ver").empty().text(data);
        });
    }
	
}]);