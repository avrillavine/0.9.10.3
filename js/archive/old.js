// old.js

    // TODO: as we remove all of the context-menus and replace, this section will disappear

    var contextMenuData = [
        {
            title: "Delete File From Project",
            id: "context-prjfile-delete",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/prjfile/*"]
        },
        {
            title: "Build",
            id: "context-prjfile-build",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/prjfile/*"]
        },
        {
            title: "Download to Robot",
            id: "context-prjfile-download",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/prjfile/*"]
        },        
        {
            title: "Delete File From Robot",
            id: "context-robotfile-delete",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/robotfile/*"]
        },
        {
            title: "Load Script",
            id: "context-robotfile-loadscript",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/robotfile/*.s"]
        },
        {
            title: "Load Panel",
            id: "context-robotfile-loadpanel",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/robotfile/*.p"]
        },
        {
            title: "Play Sound",
            id: "context-robotfile-playsound",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/robotfile/*.w"]
        },
        {
            title: "Show Bitmap",
            id: "context-robotfile-showbmp",
            contexts: ["link"],
            targetUrlPatterns: ["chrome-extension://gchcbahadlpkgkpenlkfgdgkdjedepod/robotfile/*.b"]
        }

    ];

    function contextMenuListener (info) {
        if (info.menuItemId == 'context-prjfile-delete') {
            contextProjectFileDelete(info);
        }
        else if (info.menuItemId == 'context-prjfile-build') {
            contextProjectFileBuild(info);
        }
        else if (info.menuItemId == 'context-prjfile-download') {
            contextProjectFileDownload(info);
        } 
        else if (info.menuItemId == 'context-robotfile-delete') {
            contextRobotFileDelete(info);
        }
        else if (info.menuItemId == 'context-robotfile-loadscript') {
            contextRobotLoadScript(info);
        }
        else if (info.menuItemId == 'context-robotfile-loadpanel') {
            contextRobotLoadPanel(info);
        }
        else if (info.menuItemId == 'context-robotfile-playsound') {
            contextRobotWavPlay(info);
        }
        else if (info.menuItemId == 'context-robotfile-showbmp') {
            contextRobotBmpShow(info);
        }
        else {
            printAppLog("Context menu click triggered on unknown item: " + info.toString());
        }
    }

    function contextProjectFileDelete (info) {
        var projectFileName = info.linkUrl.slice(info.linkUrl.indexOf('prjfile') + 8);
        deleteFile(projectFileName, function () {
            printAppLog("Deleted project file: " + projectFileName);
            refreshProjectList();
        }, function () {
            printAppLog("Error deleing project file: " + projectFileName);
        })
    }

    function contextProjectFileBuild (info) {
        var projectFileName = info.linkUrl.slice(info.linkUrl.indexOf('prjfile') + 8);
        var mangledFilename = mangleFilename(projectFileName);
        showBuildLogTab();
        buildFile(mangledFilename);
    }

    function contextProjectFileDownload (info) {
        var projectFileName = info.linkUrl.slice(info.linkUrl.indexOf('prjfile') + 8);
        var mangledFilename = mangleFilename(projectFileName);
        showCommLogTab();
        downloadFile(mangledFilename, function () {
            robotFilesystemList();
        });
    }

    function contextRobotFileDelete (info) {
        var robotFileName = info.linkUrl.slice(info.linkUrl.indexOf('robotfile') + 10);
        printAppLog("Delete robot file: " + robotFileName);
        robotDeleteFile(robotFileName);
    }

    function contextRobotLoadScript (info) {
        var robotFileName = info.linkUrl.slice(info.linkUrl.indexOf('robotfile') + 10);
        printAppLog("Load robot script: " + robotFileName);
        showCommLogTab();
        robotLoadScript(robotFileName);
    }

    function contextRobotLoadPanel (info) {
        var robotFileName = info.linkUrl.slice(info.linkUrl.indexOf('robotfile') + 10);
        printAppLog("Load robot panel: " + robotFileName);
        showCommLogTab();
        robotLoadPanel(robotFileName);
    }

    function contextRobotWavPlay (info) {
        var robotFileName = info.linkUrl.slice(info.linkUrl.indexOf('robotfile') + 10);
        printAppLog("Play robot wav file: " + robotFileName);
        robotPlayWav(robotFileName);
    }

    function contextRobotBmpShow (info) {
        var robotFileName = info.linkUrl.slice(info.linkUrl.indexOf('robotfile') + 10);
        printAppLog("Show robot bmp file: " + robotFileName);
        robotShowBitmap(robotFileName);
    }

    function configureContextMenus(callback) {
        chrome.contextMenus.removeAll(function () {
            var i = 0;

            function registerContextMenu() {
                var ctxMnu = contextMenuData[i];
                printAppLog("Registering '" + ctxMnu.id + "' context menu item");
                chrome.contextMenus.create(ctxMnu, function () {
                    if (chrome.runtime.lastError) {
                        printAppLog("Error registering '" + ctxMnu.id + "' context menu: " + chrome.runtime.lastError);
                    }
                    i++;
                    if (i < contextMenuData.length) {
                        registerContextMenu();
                    }
                    else {
                        if (callback) callback();
                        return;
                    }
                });
            }
            registerContextMenu();
        });
    }

    // END of context menu section

    // we shouldn't need the below, as we now have access to all projects that have been accessed in the current session

    function isEditorSessionInCurrentProject(checkEditorSession) {
        var currentProjectName = userState.currentProject;
        return (checkEditorSession.projectName == currentProjectName);
    }

    function updateSessionSettings(sessionToBeUpdated) {
        if (isEditorSessionInCurrentProject(sessionToBeUpdated)) {
            // printAppLog("File " + sessionToBeUpdated.name + " is in the current project.");
            editor.setTheme("ace/theme/eclipse");
            editor.setReadOnly(false);
        } else {
            // printAppLog("File " + sessionToBeUpdated.name + " is NOT in the current project.");
            editor.setTheme("ace/theme/eclipse_grey");
            editor.setReadOnly(true);
        }
    }

    // no need to programmatically switch to these tabs, as they are hidden in the dashboard, and the only remaining tab, variables is always there
    // we may need to show and hide the variables area, but we can do this by having the variable dump controller listen for an event
    function showRobotFsTab() {
        $('#remote-tabs a[href="#robot-fs"]').tab('show');
    }

    function showVarDumpTab() {
        $('#remote-tabs a[href="#var-dump"]').tab('show');
    }

    function showBuildLogTab() {
        $('#remote-tabs a[href="#build-log"]').tab('show');
    }
    
    function showCommLogTab() {
        $('#remote-tabs a[href="#comm-log"]').tab('show');
    }

    function showAppLogTab() {
        $('#remote-tabs a[href="#app-log"]').tab('show');
    }

    // these menu options no longer exist

    $("#menu-file-save")
        .click(saveCurrentSession);


    $("#menu-file-close")
        .click(closeCurrentSession);

    $("#menu-file-exit")
        .click(exitApplication);

    $("#menu-view-foldall")
        .click(function() {
            editor.session.foldAll();
        });

    $("#menu-view-unfoldall")
        .click(function() {
            editor.session.unfold();
        });    

    // auth stuff is being replaced
    var userDiv = document.getElementById("user-login");


    function buildFile(mangledFilename, successCallback, errorCallback, justBuild) {

        if (buildLock) {
            printBuildLog("Builder is busy, please wait before building another file.");
            return;
        }
        buildLock = true;

        var filename = mangledFilename.replace('\$', '.');
        var filenameParts = filename.split('.');
        var basename = filenameParts[0];
        var extname = filenameParts[1];

        var buildFileSession = fileSessions[filename];
        var buildFileInfo = projectFileInfo[mangledFilename];
        clearErrorInEditor(buildFileSession);

        var processData = function (readFileFunc, processorFunc) {
            showBuildLogTab();
            readFileFunc(filename, function (fileData) {
                printBuildLog("Building file '" + filename + "'");
                processorFunc(filename, fileData, function (processedData) {
                    printBuildLog("Build of '" + filename + "' successful");
                    projectOutput[mangledFilename] = processedData;
                    buildFileInfo.built = true;
                    buildLock = false;
                    if (successCallback) successCallback();
                }, function (errorCode, errorReport) {
                    printBuildLog("Error building file '" + filename + "'");
                    if (errorReport) {
                        var errorReportLines = errorReport.split('\n');
                        var errorText = errorReportLines[errorReportLines.length - 1];
                        printBuildLog("Error Report:\n=============\n" + errorText);
                        var errorLineNumbers = errorText.match(/[Ll]ine \d+/);
                        if (errorLineNumbers && errorLineNumbers.length > 0) {
                            var errorLineNumberString = errorLineNumbers[0].split(' ')[1];
                            var errorLineNumber = parseInt(errorLineNumberString);
                            markErrorInEditor(buildFileSession, errorLineNumber);
                        }
                    }
                    buildLock = false;
                    if (errorCallback) errorCallback();
                });
            }, function () {
                printBuildLog("Error reading file '" + filename + "' for build");
                buildLock = false;
                if (errorCallback) errorCallback();
            });
        }

        var doBuild = function () {
            if (extname == 'script' || extname == 'function') {
                processData(readTextFile, tokenize);
            }
            else if (extname == 'panel') {
                processData(readTextFile, processPanel);
            }
            else if (extname == 'wav') {
                processData(readBinaryFile, processWave);
            } 
            else if (extname == 'bmp') {
                processData(readBinaryFile, processBitmap);
            }
            else if (extname == 'txt') {
                processData(readTextFile, processText);
            }
            else {
                printBuildLog('Unknown file type in project: ' + filename);
                buildLock = false;
                return;
            }
        }

        if (!justBuild && buildFileSession && buildFileSession.dirty) {
            saveEditorSession(buildFileSession, function () {
                doBuild();
            }, function () {
                printBuildLog("Could not save file '" + filename + "' before build");
                buildLock = false;
                if (errorCallback) errorCallback();
                return;
            });
        }
        else {
            doBuild();
        }

    }

    function buildProject(successCallback, errorCallback) {
        showBuildLogTab();
        var projectFilenames = Object.keys(projectFiles);
        var i = 0;

        var buildFunc = function () {
            var mangledFilename = projectFilenames[i];

            buildFile(mangledFilename, function () {
                i++;
                if (i < projectFilenames.length) {
                    buildFunc();
                }
                else {
                    if (successCallback) successCallback();
                }
            }, function () {
                printBuildLog("Build failed.");
                if (errorCallback) errorCallback();
            }, true);
        };

        // make sure project files are saved before starting the build
        saveAll(function () {
            if (projectFilenames.length > 0) {
                buildFunc();                
            }
        }, function () {
            printBuildLog("Failed to save modified files, aborting build");
        });
        
    }

    function downloadAll() {

        if (!robotIsConnected) {
            showCommLogTab();
            printCommLog("Robot is not connected. Cannot download all.")
            return;
        }

        var projectOutputFilenames;
        var i = 0;

        var downloadFunc = function () {
            var mangledFilename = projectOutputFilenames[i];

            downloadFile(mangledFilename, function () {
                i++;
                if (i < projectOutputFilenames.length) {
                    downloadFunc();
                }
                else {
                    robotFilesystemList();
                }
            }, function () {
                printBuildLog("Download failed.");
            }, true);
        };

        buildProject(function () {
            showCommLogTab();
            projectOutputFilenames = Object.keys(projectOutput);
            if (projectOutputFilenames.length > 0) {
                downloadFunc();
            }
        }, function () {
            showCommLogTab();
            printCommLog("Failed to build project, aborting download");
        });
    }
