// jaderobot.js

var jadeIde = angular.module('jade-ide');

jadeIde.constant('minimumFirmwareVersion', 42);

jadeIde.factory('CommManager',
    ['$rootScope',
    'Messager',
    '$timeout',
    '$q',
    function commManagerFactory($rootScope, Messager, $timeout, $q) {

    var btDevices         = [];
    var btDevicesCount    = 0;
    var selectedCommPort  = null;
    var btAdapterGoodToGo = false;
    var dropdownCallback  = null;
    var btAdapterCallback = null;

    var printCommLog = function printCommLog(logmsg, detailed) {
        LogService.commLogMsg(logmsg, detailed);
    }

    var hexdumpLog = function hexdumpLog(data) {
    }

    function writeBTDevice(device) {
        if (7936 == device.deviceClass) {
            btDevices[btDevicesCount++] = device;
            if (dropdownCallback) {
                dropdownCallback(btDevices);
            }
        }
    }
    function deleteBTDevice(device) {
        if (7936 == device.deviceClass) {
            var i;
            var j;
            for (i = 0; btDevicesCount > i; ++i) {
                if (btDevices[i].address == device.address) {
                    break;
                }
            }
            if (i < btDevicesCount) {  //  Have a Device to Delete
                for (j = i; j < (btDevicesCount - 1); ++j) {
                    btDevices[j] = btDevices[j + 1];
                }
            }
            if (dropdownCallback) {
                dropdownCallback(btDevices);
            }
        }
    }    
    function updateBTDevice(device) {
        if (7936 == device.deviceClass) {
            var i;
            for (i = 0; btDevicesCount > i; ++i) {
                if (btDevices[i].address == device.address) {
                    break;
                }
            }
            if (i < btDevicesCount) {  //  Have a Device to Delete
                $("#btDeviceSelect option[value='" + (i + 1) + "']").text(device.name);
                btDevices[i] = device;
            }
            if (dropdownCallback) {
                dropdownCallback(btDevices);
            }
        }
    }    

    function getOS() {  //  Taken from http://stackoverflow.com/questions/9514179/how-to-find-the-operating-system-version-using-javascript
        var nAgt = navigator.userAgent;
        var os = '-';
        var i;
        var j;
        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'CrOS', r:/CrOS/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = '-';

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }
        else if (/CrOS/.test(os)) {
            for (i = 0; "Chrome/" != nAgt.slice(i, i + 7); ++i) {
            }
            for (j = i + 7, i = i + 7; " " != nAgt.slice(j, j + 1); ++j) {
            }
            osVersion = nAgt.slice(i, j);
            os        = "Chrome";
        }
        else if (/Linux/.test(os)) {
            os        = "Linux";
            osVersion = "";
        }
        else {
            switch (os) {
                case 'Mac OS X':
                    osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                    break;

                case 'Android':
                    osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                    break;

                case 'iOS':
                    osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                    osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                    break;
            }
        }

        return os + " " + osVersion;
    }

    var commManagerJadeRobot = new JadeRobot(printCommLog, hexdumpLog);

    return {

        updateCommPortList: function updateCommPortList(callback, adapterCallback) {
            if (callback) {
                dropdownCallback = callback;
            }
            if (adapterCallback) {
                btAdapterCallback = adapterCallback;
            }
            commManagerJadeRobot.loadBTSelect(function(adapter) {
//                if (!adapter.available || !adapter.powered) {
                if (!adapter.available) {
                    btAdapterGoodToGo = false;
                    if (btAdapterCallback) {
                        btAdapterCallback(btAdapterGoodToGo);
                    }
                }
                else if (!btAdapterGoodToGo) {
                    btAdapterGoodToGo = true;
                    if (btAdapterCallback) {
                        btAdapterCallback(btAdapterGoodToGo);
                    }
                    commManagerJadeRobot.getBTPairedDevices(writeBTDevice);
                    var systemOS = getOS();
                    if (("Win" === systemOS.slice(0, 3)) || ("Chrome" === systemOS.slice(0, 6))) {  //  Don't Look for external devices in Macs
                        commManagerJadeRobot.getUnpairedBTDevices(writeBTDevice, updateBTDevice, deleteBTDevice);
                    }
                }
            });
            return null;
//            var deferred = $q.defer();
//            chrome.bluetooth.getDevices(function (ports) {
//                // Messager.sendCommMessage("portlistupdate", ports);
//                $rootScope.$evalAsync(function () {
//                    commPortList = ports;
//                    deferred.resolve(ports);
//                })
//            });
//            return deferred.promise;
        },
        getCommPortList: function getCommPortList () {
            return btDevices;
        },
        selectCommPort: function selectCommPort (port) {
            selectedCommPort = port;
        },
        getSelectedCommPort: function getSelectedCommPort() {
            return selectedCommPort;
        }

    };
}])

jadeIde.factory('Robot',
    ['$q',
    '$rootScope',
    '$interval',
    'LogService',
    'CommManager',
    'Messager',
    function($q, $rootScope, $interval, LogService, CommManager, Messager) {

    var printCommLog = function printCommLog(logmsg, detailed) {
        LogService.commLogMsg(logmsg, detailed);
    }

    var hexdumpLog = function hexdumpLog(data) {
    }

    var jadeRobot = new JadeRobot(printCommLog, hexdumpLog);

    var monitorPromise = null;

    function robotUpdateStatus() {
        robotStatus()
            .then(function (statusInfo) {
                robotInfo.execInfo = statusInfo;
//                console.log(JSON.stringify(statusInfo, null, 4));
            });
    }

    function robotMonitorStatusStart() {
        monitorPromise = $interval(robotUpdateStatus, 500);
    }

    function robotMonitorStatusStop() {
        $interval.cancel(monitorPromise);
    }

    function robotResume() {
        Messager.sendRobotMessage('executing');
        execInfo = null;
        var deferred = $q.defer();
        jadeRobot.resume(
            function onSuccess() {
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to resume script execution: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotBreak() {
        var deferred = $q.defer();
        Messager.sendRobotMessage('halting');
        jadeRobot.halt(
            function onSuccess(statusInfo) {
                $rootScope.$evalAsync(function () {
                    Messager.sendRobotMessage('halted', statusInfo);
                    deferred.resolve(statusInfo);
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to break script execution: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotHalt() {
        var deferred = $q.defer();
        jadeRobot.halt(
            function onSuccess(statusInfo) {
                $rootScope.$evalAsync(function () {
                    deferred.resolve(statusInfo);
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to halt script execution: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotDeleteFile(filename) {
        var deferred = $q.defer();
        jadeRobot.del(filename,
            function onSuccess() {
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to delete file: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotResetFile(robotFilename) {
        return robotHalt()
            .then(robotDeleteFile);
    }

    function robotConnect() {
        var port = CommManager.getSelectedCommPort();
        var deferred = $q.defer();

        if (!port) {
            deferred.reject("No communications port configured, not connecting to robot.");
        }

        jadeRobot.connect(port,
            function onConnect (connid, port) {
                robotInfo.isConnected = true;
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout () {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Timeout connecting to robot on configured port");
                });
            },
            function onError (reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Error connecting to robot on configured port: \n" + reason);
                });
            });

        return deferred.promise;
    }

    function robotDisconnect() {
        var deferred = $q.defer();
        Messager.sendRobotMessage('disconnecting');
        var doDisconnect = function () {
            jadeRobot.disconnect(
                function onSuccess() {
                    robotInfo.isConnected = false;
                    // Messager.sendRobotMessage('disconnected');
                    $rootScope.$evalAsync(function () {
                        deferred.resolve();
                    });
                }
            );
        }


        if (robotInfo.isConnected) {
            robotHalt()
                .then(function () {
                    return robotLoadScript('_start.s')
                        .then(robotResume)
                        .finally(doDisconnect);
                });
        }
        else {
            deferred.reject("Already not connected to robot");
        }

        return deferred.promise;
    }

    function robotLoadScript(filename) {
        var deferred = $q.defer();

        robotHalt()
            .then(function (result) {

                Messager.sendRobotMessage('unloaded');
                jadeRobot.load(filename,
                    function onSuccess(stepInfo) {
                            if (stepInfo) {
                                $rootScope.$evalAsync(function () {
                                    Messager.sendRobotMessage('stepped', stepInfo);
                                    deferred.resolve(stepInfo);
                                });
                            }
                            else {
                                $rootScope.$evalAsync(function () {
                                    deferred.resolve();
                                });
                            }
                    },
                    function onTimeout(timeoutInfo) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Command timeout");
                        });
                    },
                    function onError(reason) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Failed to load script: \n" + reason);
                        });
                    }
                );

            })
            .catch(function (reason) {
                deferred.reject("Failed to halt before loading script: \n" + reason);
            });

        return deferred.promise;
    }

    function robotGetFileInfo(file) {
        var deferred = $q.defer();
        var robotFilename = file.outputname;
        var robotFilenames = [robotFilename];

        jadeRobot.dirlist(robotFilenames,
            function onSuccess(files) {
                var filesArray = Object.keys(files);
                if (filesArray.length > 0) {
                    $rootScope.$evalAsync(function () {
                        file['$robotFileInfo'] = files[filesArray[0]];
                        deferred.resolve(file);
                    });
                }
                else {
                    $rootScope.$evalAsync(function () {
                        file['$robotFileInfo'] = null;
                        deferred.resolve(file);
                    });
                }
            },
            function onBusy () {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Script executing");
                });
            },
            function onTimeout(timeoutInfo) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to get robot file info: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotDownloadFile(file) {
        var deferred = $q.defer();

        var fileBuffer = file.output.data;
        var robotFilename = file.outputname;

        jadeRobot.download(robotFilename, fileBuffer,
            function onSuccess() {
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout(timeoutInfo) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(result) {
                $rootScope.$evalAsync(function () {
                    deferred.reject(result);
                });
            }
        );
        return deferred.promise;
    }

    function robotTransferFile(file) {
        var deferred = $q.defer();
        var robotFilename = file.outputname;

        if (file && file.output && file.$robotFileInfo && file.output.headers("content-crc") &&
            parseInt(file.output.headers("content-crc")) == file.$robotFileInfo["content-crc"]) {
            LogService.commLogMsg("Checksum of '" + robotFilename + "' matches, no need for download.");
            deferred.resolve(file);
        }

        else {

            robotHalt()
            .then(function (result) {
                return robotDownloadFile(file)
                    .then(function () {
                        LogService.commLogMsg("Download of '" + robotFilename + "' complete.");
                        deferred.resolve(file);
                    })
                    .catch(function (reason) {
                        if (reason == "Repeated File Name") {
                            LogService.commLogMsg("File already exists: " + robotFilename + ", deleting and retrying download");
                            robotDeleteFile(robotFilename)
                                .then(function () {
                                    return robotDownloadFile(file).then(function () {
                                        deferred.resolve(file);
                                    });
                                })
                                .catch(function (reason) {
                                    deferred.reject("Failed to transfer after deleting and retrying: \n" + reason);
                                });
                        }
                        else if (reason == "Download Sync Error") {
                            LogService.commLogMsg("Unexpected end of transmission transferring file: " + robotFilename + ", deleting corrupted file and retrying download");
                            robotResetFile(robotFilename)
                                .then(robotDownloadFile(file))
                                .catch(function (reason) {
                                    deferred.reject("Failed to transfer after deleting and retrying: \n" + reason);
                                });
                        }
                        else {
                            deferred.reject("Failed to transfer: \n" + reason);

                        }
                    });
            });
        }


        return deferred.promise;
    }

    function robotStepIn() {
        Messager.sendRobotMessage('executing');
        execInfo = null;
        var deferred = $q.defer();
        jadeRobot.stepin(
            function onSuccess(stepInfo) {
                $rootScope.$evalAsync(function () {
                    Messager.sendRobotMessage('stepped', stepInfo);
                    deferred.resolve(stepInfo);
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to execute step in operation: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotStepOver() {
        var deferred = $q.defer();
        jadeRobot.stepover(
            function onSuccess() {
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to execute step over operation: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    // 250 ms poll status

    function robotStepOut() {
        var deferred = $q.defer();
        jadeRobot.stepout(
            function onSuccess() {
                $rootScope.$evalAsync(function () {
                    deferred.resolve();
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to execute step out operation: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotReset() {
        Messager.sendRobotMessage('resetting');
        var deferred = $q.defer();
        jadeRobot.reset(
            function onSuccess(stepInfo) {
                $rootScope.$evalAsync(function () {
                    Messager.sendRobotMessage('stepped', stepInfo);
                    deferred.resolve(stepInfo);
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Failed to reset script execution: \n" + reason);
                });
            }
        );
        return deferred.promise;
    }

    function robotVariableDump(callback) {
        var deferred = $q.defer();
        jadeRobot.vardump(
            function onSuccess(vars) {
                $rootScope.$evalAsync(function () {
                    deferred.resolve(vars);
                });
            },
            function onTimeout() {
                $rootScope.$evalAsync(function () {
                    deferred.reject("Command timeout");
                });
            },
            function onError(reason) {
                $rootScope.$evalAsync(function () {
                    if (reason == 'Script Executing') {
                        deferred.reject("Script executing, can't dump variables");
                    }
                    else {
                        deferred.reject("Failed to execute variable dump: \n" + reason);
                    }
                });
            }
        );
        return deferred.promise;
    }

    function createGetter(command) {
        return (
            function getterFunc(value) {
                var deferred = $q.defer();
                jadeRobot[command](
                    function onSuccess(result) {
                        $rootScope.$evalAsync(function () {
                            deferred.resolve(result);
                        });
                    },
                    function onTimeout(timeoutInfo) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Timed out executing robot command: \n" + timeoutInfo);
                        });
                    },
                    function onError(reason) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Failed to execute robot command: \n" + reason);
                        });
                    }
                );
                return deferred.promise;
            }
        );
    }

    function createSetter(command) {
        return (
            function setterFunc(value) {
                var deferred = $q.defer();
                jadeRobot[command](value,
                    function onSuccess() {
                        $rootScope.$evalAsync(function () {
                            deferred.resolve();
                        });
                    },
                    function onTimeout(timeoutInfo) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Timed out executing robot command: \n" + timeoutInfo);
                        });
                    },
                    function onError(reason) {
                        $rootScope.$evalAsync(function () {
                            deferred.reject("Failed to execute robot command: \n" + reason);
                        });
                    }
                );
                return deferred.promise;
            }
        );
    }

    var robotInfo = {
        isConnected: false,
        swVersion: null,
        hwVersion: null,
        btMac: null,
        bytesAvail: null,
        robotName: null,
        battLevel: null
    }

    var robotGetVersion = createGetter('version');

    var robotGetHwVersion = createGetter('hwversion');

    var robotGetBTMac = createGetter('btser');

    var robotGetAvailableBytes = createGetter('avail');

    var robotGetRobotName = createGetter('getname');

    var robotGetBatteryLevel = createGetter('batlevel');

    var robotStatus = createGetter('status');

    function robotGetInfo() {
        var deferred = $q.defer();

        if (robotInfo.isConnected) {
            robotGetVersion()
                .then(function (version) {
                    robotInfo.swVersion = version;
                    return robotGetHwVersion();
                })
                .then(function (hwversion) {
                    robotInfo.hwVersion = hwversion;
                    return robotGetBTMac();
                })
                .then(function (btmac) {
                    robotInfo.btMac = btmac;
                    return robotGetAvailableBytes();
                })
                .then(function (availbytes) {
                    robotInfo.bytesAvail = availbytes;
                    return robotGetRobotName();
                })
                .then(function (robotname) {
                    robotInfo.robotName = robotname;
                    return robotGetBatteryLevel();
                })
                .then(function (battlevel) {
                    robotInfo.battLevel = battlevel;
                    deferred.resolve(robotInfo);
                })
                .catch(function (reason) {
                    deferred.reject(reason);
                });
        }
        else {
            deferred.reject("Not connected to robot");
        }

        return deferred.promise;
    }

    return {
        '$jadeRobot':      jadeRobot,
        info:              robotInfo,
        updateInfo:        robotGetInfo,
        connect:           robotConnect,
        disconnect:        robotDisconnect,
        transferFile:      robotTransferFile,
        loadScript:        robotLoadScript,
        loadPanel:         createSetter('panelload'),
        showBitmap:        createSetter('showbmp'),
        playWav:           createSetter('playwav'),
        halt:              robotHalt,
        breakExecution:    robotBreak,
        resume:            robotResume,
        stepIn:            robotStepIn,
        stepOver:          robotStepOver,
        stepOut:           robotStepOut,
        reset:             robotReset,
        deleteFile:        robotDeleteFile,
        getVariableDump:   robotVariableDump,
        getVersion:        robotGetVersion,
        getHwVersion:      robotGetHwVersion,
        getBTMac:          robotGetBTMac,
        getAvailableBytes: robotGetAvailableBytes,
        getRobotName:      robotGetRobotName,
        getRobotStatus:    robotStatus,
        getBatteryLevel:   robotGetBatteryLevel,
        garbageCollect:    createGetter('garbage'),
        setVolume:         createSetter('setvol'),
        monitorStart:      robotMonitorStatusStart,
        monitorStop:       robotMonitorStatusStop,
        getFileInfo:       robotGetFileInfo
    };

}]);