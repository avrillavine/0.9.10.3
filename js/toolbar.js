// toolbar.js

angular.module('jade-ide').filter("stripBTPath", function() {
    return function(x) {
        return x.slice(9, x.indexOf('-SPPDev'));
    };
 });

angular.module('jade-ide').controller('ToolbarController', [
    '$scope',
    '$timeout',
    'Robot',
    'CommManager',
    'Messager',
    'errorCatcher',
    'ChromeBrowser',
    'minimumFirmwareVersion',
    'ProjectManager',
    function($scope, $timeout, Robot, CommManager, Messager, errorCatcher, ChromeBrowser, minimumFirmwareVersion, ProjectManager) {

	$scope.isRobotConnected = false;
	$scope.connectTransitioning = false;
	$scope.toggleConnect = function toggleConnect()
	{
        $scope.commPortDropdownOpen = false;
		$scope.connectTransitioning = true;
		if (!$scope.isRobotConnected) {
			Robot.connect()
				.then(function () {
                    return Robot.halt();
                })
                .then(function () {
                    return Robot.updateInfo();
                })
                .then(function (robotInfo) {
                    $scope.isRobotConnected = true;
                    $scope.connectTransitioning = false;
                    if ($scope.currentProject) {
                        $scope.buildAndDownloadProject($scope.currentProject);
                    }
                    if (robotInfo && robotInfo.swVersion) {
                        var firmwareVersion = parseInt(robotInfo.swVersion.split('.')[0]);
                        if (firmwareVersion < minimumFirmwareVersion) {
                            errorCatcher.warning("Version Mismatch", "This version of Jade Support is designed to work with Jade Robot firmware version " +
                                                                     minimumFirmwareVersion + ", but your version is " + firmwareVersion + ". " + 
                                                                     "You can continue to use the current version of firmware, but some operations " + 
                                                                     "may not work correctly.");
                        }
                    }
                })
                .catch(function (reason) {
                    $scope.connectTransitioning = false;
                    errorCatcher.handle("Error connecting to robot", reason);
                });
		}
		else {
			Robot.disconnect()
				.then(function () {
					$scope.isRobotConnected = false;
					$scope.connectTransitioning = false;
				})
                .catch(function (reason) {
                    $scope.connectTransitioning = false;
                    errorCatcher.handle("Error disconnecting from robot", reason);
                });
		}
	}

//  BELOW COMMENTED OUT FO 0.9.10.0 
//    // replace the Cmd- with &#8984; when we figure out how to do it
//    $scope.editshortcuts = {
//        undo: { "mac": "Cmd-Z",
//                "win": "Ctrl-Z"},
//        redo: { "mac": "Cmd-Y",
//                "win": "Ctrl-Y"},
//        cut: { "mac": "Cmd-X",
//               "win": "Ctrl-X"},
//        copy: { "mac": "Cmd-C",
//                "win": "Ctrl-C"},
//        paste: { "mac": "Cmd-V",
//                 "win": "Ctrl-V"},
//        selectall: { "mac": "Cmd-A",
//                     "win": "Ctrl-A"}
//    };
//
//    $scope.editor = {
//        undo: function undo () {
//            Messager.sendEditorMessage('undo');
//        },
//        redo: function redo () {
//            Messager.sendEditorMessage('redo');
//        },
//        cut: function cut () {
//            Messager.sendEditorMessage('cut');
//        },
//        copy: function copy () {
//            Messager.sendEditorMessage('copy');
//        },
//        paste: function paste () {
//            Messager.sendEditorMessage('paste');
//        },
//        selectall: function selectall () {
//            Messager.sendEditorMessage('selectall');
//        }
//    };

    $scope.buildAndRunInProgress = false;
    $scope.buildDownloadAndRunProject = function buildDownloadAndRunProject(project) {
        if (!$scope.buildAndRunInProgress && $scope.isRobotConnected && !$scope.connectTransitioning) {
            $scope.buildAndRunInProgress = true;
            ProjectManager.bufferProject(project)
                .then(ProjectManager.buildProject)
                .then(ProjectManager.checkRobot)
                .then(ProjectManager.transferProject)
                .then(ProjectManager.checkAndLoadProject)
                .then(ProjectManager.resumeExecution)
                .catch(errorCatcher.catch('Error during project deployment'))
                .finally(function () {
                    $scope.buildAndRunInProgress = false;
                });
        }
    }
    $scope.buildDownloadAndResetProject = function buildDownloadAndResetProject(project) {
        if (!$scope.buildAndRunInProgress && $scope.isRobotConnected && !$scope.connectTransitioning) {
            $scope.buildAndRunInProgress = true;
            ProjectManager.bufferProject(project)
                .then(ProjectManager.buildProject)
                .then(ProjectManager.checkRobot)
                .then(ProjectManager.transferProject)
                .then(ProjectManager.loadProject)
                .catch(errorCatcher.catch('Error during project deployment'))
                .finally(function () {
                    $scope.buildAndRunInProgress = false;
                });
        }
    }
    $scope.robot = {
        run: function run () {
			Robot.resume();
        },
        pause: function pause () {
            Robot.breakExecution();
        },
        reset: function reset () {
            Robot.reset();
        },
        stepIn: function stepIn () {
            Robot.stepIn();
        },
        stepOver: function stepOver () {
            // Robot.stepOver();
            Robot.stepIn();
        },
        stepOut: function stepOut () {
            // Robot.stepOut();
            Robot.stepIn();
        }
    }

    $scope.commPortDropdownOpen = false;

    $scope.btActiveFlag = false;
    $scope.commPortList = null;
    $scope.updateCommPortList = function () {
    	CommManager.updateCommPortList(function(devices) {
    		$scope.commPortList = devices;
			for (var i = 0; $scope.commPortList.length > i; ++i) {
				if ($scope.commPortList[i].name.startsWith("Unknown or Unsupported")) {
					$scope.commPortList[i].name = "Unknown Device";
				}
			}
            ChromeBrowser.loadLocalStorage('lastPort')
                .then(function (lastPort) {
                    if (lastPort) {
						for (var i = 0; $scope.commPortList.length > i; ++i) {
							if ($scope.commPortList[i].address == lastPort.address) {
						        var portname = lastPort.name;
						    	$scope.selectedCommPort = portname;
							}
						}
                    }
                });
		},
		function(btStatusFlag) {
			$scope.btActiveFlag = btStatusFlag;
		});
//    		.then(function (commPortList) {
//    			$scope.commPortList = commPortList;
//                ChromeBrowser.loadLocalStorage('lastPort')
//                    .then(function (lastPort) {
//                        if (lastPort) {
//                            $scope.selectCommPort(lastPort);
//                        }
//                    });
//    		});
    }

    $scope.selectedCommPort = null;
    $scope.selectCommPort = function selectCommPort (port) {
		if ("disconnectMessage" === port) {
			if ($scope.isRobotConnected && !$scope.connectTransitioning) {  //  Can do the Disconnect
				$scope.toggleConnect();
			}
		}
		else {  //  Connect to a Port?  
			if (!$scope.isRobotConnected && !$scope.connectTransitioning) {  //  Can do the Connect
		        ChromeBrowser.saveLocalStorage('lastPort', port);
		        var portname = port.name;
		    	$scope.selectedCommPort = portname;
		    	CommManager.selectCommPort(port.address);
				$scope.toggleConnect();
			}
		}
    }

}]);