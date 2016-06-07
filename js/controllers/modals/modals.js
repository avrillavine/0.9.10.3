// modals.js

    $("#createProjectButton")
        .click(function () {
            var newProjectName = $("#newProjectName").val();
            $("#newProjectModal").modal('hide');
            showAppLogTab();
            newProject(newProjectName, '');
        });

    $("#openProjectButton")
        .click(function () {
            var loadProjectName = $("#openProjectSelect").val();
            userState.currentProject = loadProjectName;
            projectOutput = {};
            saveUserState();
            refreshProjectList(function () {
                if (currentSession) {
                    updateSessionSettings(currentSession);
                }
                $("#openProjectModal").modal('hide');
                if (robotIsConnected) {
                    robotFilesystemList();
                }
            }, function () {
                printAppLog("Failed to refresh project list");
            });
        });

    $("#createFunctionButton")
        .click(function () {
            var newFunctionName = $("#newFunctionName").val();
            var newFunctionFileName = newFunctionName + '.function';

            writeTextFile(newFunctionFileName, '', function () {
                // writeTextFile success
                refreshProjectList(function () {
                    $("#newFunctionModal").modal('hide');
                }, function () {
                    printAppLog("Failed to refresh project list");
                });
            }, function () {
                printAppLog("Failed to write file: " + newFunctionFileName);
            });

        });

    $("#createPanelButton")
        .click(function () {
            var newPanelName = $("#newPanelName").val();
            var newPanelFileName = newPanelName + '.panel';

            writeTextFile(newPanelFileName, '', function () {
                // writeTextFile success
                refreshProjectList(function () {
                    $("#newPanelModal").modal('hide');
                }, function () {
                    printAppLog("Failed to refresh project list");
                });
            }, function () {
                printAppLog("Failed to write file: " + newPanelFileName);
            });

        });

    $("#createTextButton")
        .click(function () {
            var newTextName = $("#newTextName").val();
            var newTextFileName = newTextName + '.txt';

            writeTextFile(newTextFileName, '', function () {
                // writeTextFile success
                refreshProjectList(function () {
                    $("#newTextModal").modal('hide');
                }, function () {
                    printAppLog("Failed to refresh project list");
                });
            }, function () {
                printAppLog("Failed to write file: " + newPanelFileName);
            });

        });

    function limitFilenameLength(inputSelector, buttonSelector, errorHelpSelector) {
        var inputName = inputSelector.val();
        var inputDiv = inputSelector.parent();

        if (inputName.length > 8) {
            inputDiv.toggleClass("has-error", true);
            buttonSelector.prop("disabled", true);
            errorHelpSelector.text("Please remove characters in the name to reduce the length to 8 or less.")
            errorHelpSelector.toggleClass("invisible", false);
        }
        else {
            inputDiv.toggleClass("has-error", false);
            buttonSelector.prop("disabled", false);
            errorHelpSelector.toggleClass("invisible", true);
        }        
    }

    $("#newProjectModal")
        .on('input propertychange', function () {
            limitFilenameLength($("#newProjectName"), $("#createProjectButton"), $("#newProjectErrorHelp"));
        });
    $("#newProjectModal")
        .on('shown.bs.modal', function () {
            $("#newProjectName").focus();
        });

    $("#newFunctionModal")
        .on('input propertychange', function () {
            limitFilenameLength($("#newFunctionName"), $("#createFunctionButton"), $("#newFunctionErrorHelp"));
        });
    $("#newFunctionModal")
        .on('shown.bs.modal', function () {
            $("#newFunctionName").focus();
        });

    $("#newPanelModal")
        .on('input propertychange', function () {
            limitFilenameLength($("#newPanelName"), $("#createPanelButton"), $("#newPanelErrorHelp"));
        });
    $("#newPanelModal")
        .on('shown.bs.modal', function () {
            $("#newPanelName").focus();
        });

    $("#newTextModal")
        .on('input propertychange', function () {
            limitFilenameLength($("#newTextName"), $("#createTextButton"), $("#newTextErrorHelp"));
        });
    $("#newTextModal")
        .on('shown.bs.modal', function () {
            $("#newTextName").focus();
        });

    $("#openProjectModal")
        .on('show.bs.modal', function () {
            
            getProjects(function(projectList) {
                var openProjectSelect = $("#openProjectSelect");
                openProjectSelect.empty();

                Object.keys(projectList).forEach(function (projectName) {
                    $('<option></option>').text(projectName).appendTo(openProjectSelect);
                });

            }, function () {
                printAppLog("Error reading project list");
            });

        });

    $("#configCommModal")
        .on('show.bs.modal', function () {
            chrome.serial.getDevices(function (ports) {
                var commPortSelect = $("#commPortSelect");
                commPortSelect.empty();

                for (var i = 0; i < ports.length; i++) {
                    var portName = ports[i].path;
                    $('<option></option>').text(portName).appendTo(commPortSelect);
                }

                updateCommPortFields();
            });
        });

    $("#saveCommPortButton")
        .click(function () {
            var commPort = $("#commPortSelect").val();
            userConfig.commPort = commPort;
            saveUserConfig(function () {
                showCommLogTab();
                $("#configCommModal").modal('hide');
                printCommLog("Saved new communications port: " + userConfig.commPort);
            });
        });

    $("#clearSavedCommPort")
        .click(clearSavedCommPort);

    $("#rescanForRobot")
        .click(function () {
            $("#configCommModal").modal('hide');
            scanForRobot();
        });

    function updateCommPortFields() {
        var savedCommPort = $("#savedCommPort");
        var clearSavedPortMsg = $("#clearSavedPortMsg");
        if (userConfig && userConfig.commPort) {
            savedCommPort.empty().text(userConfig.commPort);
            clearSavedPortMsg.toggleClass('hidden', false);
        }
        else {
            savedCommPort.empty().text('None')
            clearSavedPortMsg.toggleClass('hidden', true);
        }
    }

    function clearSavedCommPort() {
        userConfig.commPort = null;
        saveUserConfig(updateCommPortFields);
    }

    $("#welcome-getstarted")
        .click(function() {
            $("#newProjectModal").modal('show');
        });

    $("#menu-file-newproject")
        .click(function() {
            $("#newProjectModal").modal('show');
        });

    $("#menu-file-newprojectfromscriptfile")
        .click(function () {
            showAppLogTab();
            newProjectFromScriptFile(function (newProjectName, importedFilename) {
                openProjectFile(importedFilename);
            });
        });

    $("#menu-file-openproject")
        .click(function() {
            $("#openProjectModal").modal('show');
        });

    $("#menu-file-new-function")
        .click(function() {
            $("#newFunctionModal").modal('show');
        });

    $("#menu-file-new-panel")
        .click(function() {
            $("#newPanelModal").modal('show');
        });

    $("#menu-file-new-text")
        .click(function() {
            $("#newTextModal").modal('show');
        });

