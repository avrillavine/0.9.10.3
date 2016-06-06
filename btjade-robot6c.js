//  Multiple Updates from Jon's original code
//  For Jade Action 0.7
//  Adding code for Jade Action 0.8
//  Added "doRoverMode" which should start Rover Mode but there still needs to be a general call back for the data coming back

const maxReadSize = 64;
const commandTimeout = 1000;

const filetypemap = {
    "s": "Script",
    "f": "Function",
    "p": "Panel",
    "b": "Bitmap",
    "w": "Wave",
    "txt": "Text"
};

function convertArrayBufferToString (buf, callback) {
    var outString = String.fromCharCode.apply(null, new Uint8Array(buf));
    
    // synchronously call the callback if specified and then return the value as well
    if (callback) callback(outString);
    return outString;
}

function convertArrayBufferToDumpString (buf, callback) {
    var dumpString = '['
    var charArray = new Uint8Array(buf);
    for (var i = 0; i < charArray.length; i++) {
        dumpString += charArray[i].toString();
        if (i < charArray.length - 1) dumpString += ', ';
    }
    dumpString += ']';

    // synchronously call the callback if specified and then return the value as well
    if (callback) callback(dumpString);
    return dumpString;
}

function convertStringToArrayBuffer (str, callback) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    // synchronously call the callback if specified and then return the value as well
    if (callback) callback(buf);
    return buf;
}

function JadeRobot(logCallback, hexdumpCallback) {
    this.socket = null;
    this.commLock = false;

    this.result = "";

    this.rxCallback = null;
    this.timeoutCallback = null;
    this.errorCallback = null;

    this.roverHandlers = {
        'jpeg': null,
        'objd': null,
        'spec': null,
        'lite': null,
        'batt': null,
        'eror': null,
        'stat': null,
        'term': null
    };

    this.logCallback = logCallback;
    this.hexdumpCallback = hexdumpCallback;

    this.robotMode = 'command';

    chrome.bluetoothSocket.onReceive.addListener($.proxy(this.handleOnReceive, this));
    chrome.bluetoothSocket.onReceiveError.addListener($.proxy(this.handleOnReceiveError, this));
    chrome.bluetooth.onAdapterStateChanged.addListener($.proxy(this.handleAdapterStateChanged, this));
}

/*
JadeRobot.prototype.findRobot = function(connectCallback, robotNotFoundCallback) {
    chrome.serial.getDevices(function (ports) {

        var i = 0;

        var robotNotFound = function () {
            if (this.logCallback) this.logCallback('No robot found on port: ' + ports[i].path);

            i++;
            if (i < ports.length) {
                return probeRobot(ports[i].path);
            } else {
                return robotNotFoundCallback();
            }
        }.bind(this);

        var probeRobot = function (portPath) {
            this.connect(portPath, function (connid) {
                return connectCallback(connid, ports[i].path);
            }, robotNotFound, robotNotFound);
        }.bind(this);

        if (ports.length > 0) {
            probeRobot(ports[i].path);
        }
        else {
            if (this.logCallback) this.logCallback('No communication ports found.');
        }

    }.bind(this));
}
*/
JadeRobot.prototype.handleAdapterStateChanged = function(adapter) {
    var updateBTSelect = getUpdateBTSelected();
    if (updateBTSelect) {
        updateBTSelect(adapter);
    }
}
JadeRobot.prototype.getBTPairedDevices = function(callback) {
    chrome.bluetooth.getDevices(function(devices) {  //  Set up list of available ports
        for (var i = 0; i < devices.length; i++) {
            if (7936 == devices[i].deviceClass) {
                callback(devices[i]);
            }
        }
    });
}
JadeRobot.prototype.getUnpairedBTDevices = function(writeCallback, updateCallback, deleteCallback) {
    chrome.bluetooth.onDeviceAdded.addListener(writeCallback);
    chrome.bluetooth.onDeviceChanged.addListener(updateCallback);
    chrome.bluetooth.onDeviceRemoved.addListener(deleteCallback);
    
    chrome.bluetooth.startDiscovery(function() {  // Stop discovery after 10 minutes.
//        setTimeout(function() {
//            chrome.bluetooth.stopDiscovery(function() {});
//        }, 600000);
    });
}
JadeRobot.prototype.stopBTDiscovery = function() {
    chrome.bluetooth.stopDiscovery(function() {});
}
JadeRobot.prototype.loadBTSelect = function(callback) {
    chrome.bluetooth.getAdapterState(function(adapter){
        if (callback) {
            setUpdateBTSelected(callback);
            callback(adapter);
        }
    });
}

JadeRobot.prototype.connect = function(address, connectCallback, timeoutCallback, errorCallback) {
    if (this.logCallback) this.logCallback('Attempting connection to robot on address: ' + address);

    var doConnect = function doConnect () {

        chrome.bluetoothSocket.connect(this.socket.socketId, address, '00001101-0000-1000-8000-00805f9b34fb', function () {

            if (this.logCallback) this.logCallback("Connection opened to bluetooth device at address: " + address);

            var connid = this.socket.socketId;

            chrome.bluetoothSocket.setPaused(connid, true, function () {

                // trying pinging to detect robot
                this.doCommand('*',

                    // rxCallback()
                    function (rxdata) {
                        if (rxdata == '-*') {
                            if (this.logCallback) this.logCallback("Received ping reply on address: " + address);
                            if (connectCallback) connectCallback(connid, address);
                            return;
                        }
                        else {
                            if (this.logCallback) this.logCallback("Received incorrect reply on address: " + address);
                            if (errorCallback) errorCallback();
                            return;
                        }
                    }.bind(this),

                    // timeoutCallback()
                    function () {
                        if (this.socket) {
                            if (this.logCallback) this.logCallback('(' + connid + ') no response from robot, closing connection');
                            chrome.serial.disconnect(connid, function (result) {
                                if (this.logCallback) this.logCallback('(' + connid + ') close successful: ' + result);
                                this.socket = null;
                                if (timeoutCallback) timeoutCallback();
                                return;
                            });
                        }
                    }.bind(this),

                    // errorCallback()
                    function () {
                        if (this.socket) {
                            if (this.logCallback) this.logCallback('(' + connid + ') error communicating with robot, closing connection');
                            chrome.serial.disconnect(connid, function (result) {
                                if (this.logCallback) this.logCallback('(' + connid + ') close successful: ' + result);
                                this.socket = null;
                                if (errorCallback) errorCallback();
                                return;
                            });
                        }

                    }.bind(this)
                );

            }.bind(this));

        }.bind(this));

    }.bind(this)

    chrome.bluetoothSocket.create(function (createInfo) {
        this.socket = createInfo;
        doConnect();
    }.bind(this));

}

JadeRobot.prototype.disconnect = function(disconnectCallback) {
    if (this.socket) {
        var connid = this.socket.socketId;

        if (this.logCallback) this.logCallback('(' + connid + ') disconnecting');
        chrome.bluetoothSocket.disconnect(connid, function () {
            if (this.logCallback) this.logCallback('(' + connid + ') disconnect successful');
            chrome.bluetoothSocket.close(connid, function () {
                this.socket = null;
                if (disconnectCallback) disconnectCallback();
            }.bind(this));
        }.bind(this));
    }
}

JadeRobot.prototype.doCommand = function(txdata, rxCallback, timeoutCallback, errorCallback, timeoutOverride) {
    if (!this.socket) {
        var errorinfo = "Cannot execute command, not connected";
        if (this.logCallback) this.logCallback(errorinfo);
        if (errorCallback) errorCallback(errorinfo)
        return;
    }
    var connid = this.socket.socketId;

    // allow a single use of the communications link at a time
    if (this.commLock) {
        var errorinfo = "Robot communications is busy, cannot execute command.";
        if (this.logCallback) this.logCallback(errorinfo);
        if (errorCallback) errorCallback(errorinfo)
        return;
    }
    this.commLock = true;

    var txstring = txdata + '\r';

    var rxcb = function rxcb (result) {
        this.commLock = false;
        if (rxCallback) rxCallback(result);
    }.bind(this);
    var timeoutcb = function timeoutcb () {
        this.commLock = false;
        if (timeoutCallback) timeoutCallback();
    }.bind(this);
    var errorcb = function errorcb (errorinfo) {
        this.commLock = false;
        if (errorCallback) errorCallback(errorinfo);
    }.bind(this);

    // if timeoutOverride specified, set timeout before communication, and reset afterwards
   if (typeof timeoutOverride === "undefined-274") {
        this.sendCommand(txstring, null, rxcb, timeoutcb, errorcb);
    }
    else {
        this.overrideCommandTimeout(timeoutOverride, function () {

            this.sendCommand(txstring, null,
                // rxcb
                function (rxdata) {
                    this.resetCommandTimeout(rxcb, rxdata);
                }.bind(this),
                // timeoutcb
                function () {
                    this.resetCommandTimeout(timeoutcb);
                }.bind(this),
                // errorcb
                function (errorinfo) {
                    this.resetCommandTimeout(errorcb, errorinfo);
                }.bind(this)
            );

        }.bind(this), function () {
            if (this.logCallback) this.logCallback('('+ connid +') Failed to set command send/receive timeouts.');
            this.commLock = false;
        }.bind(this));

    }
}

JadeRobot.prototype.doSingleRoverCommand = function(txdata, packetHeader, rxCallback, timeoutCallback, errorCallback) {
    if (!packetHeader) {
        if (this.logCallback) this.logCallback('Packet header is required for single rover mode command');
        return;
    }
    else if (typeof this.roverHandlers[packetHeader] === "undefined-308") {
        if (this.logCallback) this.logCallback('Invalid expected packet header specified: "' + packetHeader + '"');
        return;
    }

    if (!this.socket) {
        if (this.logCallback) this.logCallback('Cannot execute command, not connected');
        return;
    }
    var connid = this.socket.socketId;

    // allow a single use of the communications link at a time
    if (this.commLock) {
        if (this.logCallback) this.logCallback("Robot communications is busy, cannot execute command.");
        return;
    }
    this.commLock = true;
    this.robotMode = 'rover';

    var txstring = txdata + '\r';

    var rxcb = function rxcb (result) {
        this.commLock = false;
        this.robotMode = 'command';
        if (rxCallback) rxCallback(result);
    }.bind(this);
    var timeoutcb = function timeoutcb () {
        this.commLock = false;
        this.robotMode = 'command';
        if (timeoutCallback) timeoutCallback();
    }.bind(this);
    var errorcb = function errorcb (errorinfo) {
        this.commLock = false;
        this.robotMode = 'command';
        if (errorCallback) errorCallback(errorinfo);
    }.bind(this);

    var packetcb = function packetcb (result) {
        chrome.serial.setPaused(connid, true, function () {
            this.roverHandlers[packetHeader] = null;
            if (rxcb) rxcb(result);
        }.bind(this));
    }.bind(this);

    this.roverHandlers[packetHeader] = packetcb;

    this.sendCommand(txstring, null, rxcb, timeoutcb, errorcb);
}

JadeRobot.prototype.doRoverCommand = function(txdata, packetHeader, rxCallback, timeoutCallback, errorCallback) {
    if (packetHeader && typeof this.roverHandlers[packetHeader] === "undefined-358") {
        if (this.logCallback) this.logCallback('Invalid expected packet header specified: "' + packetHeader + '"');
    }

    if (!this.socket) {
        if (this.logCallback) this.logCallback('Cannot execute command, not connected');
        return;
    }
    var connid = this.socket.socketId;

    // allow a single use of the communications link at a time
    if (this.commLock) {
        if (this.logCallback) this.logCallback("Robot communications is busy, cannot execute command.");
        return;
    }
    this.commLock = true;

    var txstring = txdata + '\r';

    var rxcb = function rxcb (result) {
        this.commLock = false;
        if (rxCallback) rxCallback(result);
    }.bind(this);

    var timeoutcb = function timeoutcb () {
        this.commLock = false;
        if (timeoutCallback) timeoutCallback();
    }.bind(this);

    var errorcb = function errorcb (errorinfo) {
        this.commLock = false;
        if (errorCallback) errorCallback(errorinfo);
    }.bind(this);

    var packetcb = function packetcb (result) {
        this.roverHandlers[packetHeader] = null;
        rxcb(result);
    }.bind(this);

    var sentcb = function sentcb () {
        this.commLock = false;
        if (rxCallback) rxCallback('');
    }.bind(this);

    if (this.robotMode == 'rover') {
        if (packetHeader) {
            this.roverHandlers[packetHeader] = packetcb;
            this.sendCommand(txstring, null, rxcb, timeoutcb, errorcb);
        }
        else {
            this.sendCommand(txstring, sentcb, rxcb, timeoutcb, errorcb);
        }
    }
    else {
        this.sendCommand(txstring, null, rxcb, timeoutcb, errorcb);
    }

}

JadeRobot.prototype.startRoverMode = function(rxCallback, packetCallback, timeoutCallback, errorCallback) {
    if (!this.socket) {
        if (this.logCallback) this.logCallback('Cannot execute command, not connected');
        return;
    }
    var connid = this.socket.socketId;

    // allow a single use of the communications link at a time
    if (this.commLock) {
        if (this.logCallback) this.logCallback("Robot communications is busy, cannot execute command.");
        return;
    }
    this.commLock = true;

    var txstring = "roverstart\r";

    var rxcb = function rxcb (result) {
        this.commLock = false;
        this.robotMode = 'rover';
        this.rxCallback = rxCallback;
        if (rxCallback) rxCallback(result);

        // let loose the stream of data!!!!!
        chrome.serial.setPaused(connid, false, function () {});
    }.bind(this);
    var timeoutcb = function timeoutcb () {
        this.commLock = false;
        if (timeoutCallback) timeoutCallback();
    }.bind(this);
    var errorcb = function errorcb (errorinfo) {
        this.commLock = false;
        if (errorCallback) errorCallback(errorinfo);
    }.bind(this);
    var packetcb = function packetcb (result, prefix, expectedLength, actualLength) {
        if (packetCallback) packetCallback(result, prefix, expectedLength, actualLength);
    }

    this.roverHandlers['jpeg'] = packetcb;
    this.roverHandlers['objd'] = packetcb;
    this.roverHandlers['lite'] = packetcb;
    this.roverHandlers['batt'] = packetcb;

    this.sendCommand(txstring, null, rxcb, timeoutcb, errorcb);
}

JadeRobot.prototype.stopRoverMode = function(rxCallback, timeoutCallback, errorCallback) {
    if (!this.socket) {
        if (this.logCallback) this.logCallback('Cannot execute command, not connected');
        return;
    }
    var connid = this.socket.socketId;

    // allow a single use of the communications link at a time
    if (this.commLock) {
        if (this.logCallback) this.logCallback("Robot communications is busy, cannot execute command.");
        return;
    }
    this.commLock = true;

    var txstring = "roverstop\r";

    var rxcb = function rxcb (result) {
        this.commLock = false;
        this.rxCallback = rxCallback;
        if (rxCallback) rxCallback(result);
    }.bind(this);
    var timeoutcb = function timeoutcb () {
        this.commLock = false;
        if (timeoutCallback) timeoutCallback();
    }.bind(this);
    var errorcb = function errorcb (errorinfo) {
        this.commLock = false;
        if (errorCallback) errorCallback(errorinfo);
    }.bind(this);

    var termcb = function termcb () {
        chrome.serial.setPaused(connid, true, function () {
            this.robotMode = 'command';
            this.roverHandlers['term'] = null;
            rxcb('');
        }.bind(this));
    }.bind(this);

    this.roverHandlers['term'] = termcb;

    this.sendCommand(txstring, null, null, timeoutcb, errorcb);
}

JadeRobot.prototype.overrideCommandTimeout = function overrideCommandTimeout (timeoutOverride, overrideCallback) {
    var connid = this.socket.socketId;
/*
    chrome.serial.update(connid, { 'receiveTimeout': timeoutOverride, 'sendTimeout': timeoutOverride }, function (result) {
        if (result) {
            if (this.logCallback) this.logCallback('('+ connid +') Send/receive timeout override applied: ' + timeoutOverride + ' ms.');
        }
        else {
            if (this.logCallback) this.logCallback('('+ connid +') Failed to set command send/receive timeouts.');
        }
        if (overrideCallback) overrideCallback();
    });
*/
    if (overrideCallback) overrideCallback();
}

JadeRobot.prototype.resetCommandTimeout = function resetCommandTimeout (resetcb, resetcbparam1) {
    var connid = this.socket.socketId;
/*
    chrome.serial.update(connid, { 'receiveTimeout': commandTimeout, 'sendTimeout': commandTimeout }, function (result) {
        if (result) {
            if (this.logCallback) this.logCallback('('+ connid +') Send/receive timeout reset to: ' + commandTimeout + ' ms.');
        }
        else {
            if (this.logCallback) this.logCallback('('+ connid +') Failed to reset command send/receive timeouts.');
        }
        if (resetcb) resetcb(resetcbparam1);
    });
*/
    if (resetcb) resetcb(resetcbparam1);
}

JadeRobot.prototype.sendCommand = function sendCommand (txstring, txcb, rxcb, timeoutcb, errorcb) {
    if (!this.socket) {
        if (this.logCallback) this.logCallback('Cannot send command, not connected');
        return;
    }
    var connid = this.socket.socketId;

    var doSend = function doSend () {

        if (this.logCallback) this.logCallback('('+ connid +') >> ' + txstring + ' ##');
        convertStringToArrayBuffer(txstring, function (txbuffer) {

            this.rxCallback = rxcb;
            this.timeoutCallback = timeoutcb;
            this.errorCallback = errorcb;

            // unpause serial connection to start timeout countdown
            chrome.bluetoothSocket.setPaused(connid, false, function () {

                chrome.bluetoothSocket.send(connid, txbuffer, function (sendInfo) {

                    // success
                    if (sendInfo && !sendInfo.error) {
                        if (this.logCallback) this.logCallback('('+ connid +') tx arrayBuffer written: ' + sendInfo.bytesSent, true);
                        if (txcb) txcb();
                    }
                    // error reported
                    else if (sendInfo && sendInfo.error) {
                        if (this.logCallback) this.logCallback('('+ connid +') tx error: ' + sendInfo.error);
                        chrome.bluetoothSocket.setPaused(connid, true, function () {
                            if (errorcb) errorcb(sendInfo.error);
                        });
                    }
                    // failure, no error reported
                    else {
                        if (this.logCallback) this.logCallback('('+ connid +') tx info is null');
                        chrome.bluetoothSocket.setPaused(connid, true, function () {
                            if (errorcb) errorcb("sendInfo is null");
                        });
                    }
                    return;

                }.bind(this)); // chrome.serial.send()

            }.bind(this)); // chrome.serial.setPaused()

        }.bind(this)); // convertStringToArrayBuffer()

    }.bind(this); // doSend()

    doSend();
}

JadeRobot.prototype.handleOnReceive = function (info) {

    var connid = this.socket.socketId;
    var handleReceiveCommandMode = function handleReceiveCommandMode (receiveInfo) {

        var rxbuffer = receiveInfo.data;
        convertArrayBufferToString(rxbuffer, function (rxstring) {

            this.result += rxstring;

            if (this.result.charCodeAt(this.result.length - 1) == 13) {
                chrome.bluetoothSocket.setPaused(connid, true, function () {
                    var rxdata = this.result.slice(0, -1);
                    this.result = '';
                    if (this.logCallback) this.logCallback('('+ connid +') << ' + rxdata + " ##");
                    if (this.rxCallback) this.rxCallback(rxdata);
                }.bind(this));
            }
            else {
                // if (this.logCallback) this.logCallback('('+ connid +') CR not received yet, continuing to wait', true);
                // chrome.serial.flush(connid, function (result) {
                //     if (this.logCallback) this.logCallback('('+ connid +') flush completed: ' + result, true);
                // }.bind(this));
                return;
            }

        }.bind(this));

    }.bind(this);

    var handleReceiveRoverMode = function handleReceiveRoverMode (receiveInfo) {

        var rxbuffer = receiveInfo.data;
        convertArrayBufferToString(rxbuffer, function (rxstring) {

            this.result += rxstring;
//            if (this.hexdumpCallback) this.hexdumpCallback('('+ connid +') << ' + rxstring + " ##");

            if ((0xFF == this.result.charCodeAt(this.result.length - 2)) &&
                (0xD9 == this.result.charCodeAt(this.result.length - 1))) {

                //  looking for "xyzw:", this is the failure case
                if (!/^[a-z]{4}[:]/.test(this.result)) {
                    var rxdata = this.result.slice(0, 5);
                    this.result = "";
                    if (this.logCallback) this.logCallback('('+ connid +') << discarded data packet due to invalid header');
                    if (this.discardCallback) {
                        this.discardCallback(rxdata);
                    }
                }
                // found "xyzw:"
                else {
                    var expectedLength = this.result.charCodeAt(5) +
                                        (this.result.charCodeAt(6) << 8) +
                                        (this.result.charCodeAt(7) << 16);
                    var actualLength   = this.result.length;

                    // if actualLength is too far off expectedLength
                    if (32 < Math.abs(expectedLength - actualLength)) {
                        var rxdata = this.result.slice(0, 5);
                        this.result = "";
                        if (this.logCallback) this.logCallback('('+ connid +') << discarded data packet due to incorrect length: expected ' + expectedLength + ', actual ' + actualLength);
                        if (this.discardCallback) {
                            this.discardCallback(rxdata);
                        }
                    }
                    // well-formed rover mode data packet, call handler if one exists
                    else {
                        var prefix = this.result.slice(0, 4);
                        var rxdata = this.result.slice(8);
                        if ("jpeg" != prefix) {
                            if (this.logCallback) this.logCallback('('+ connid +') << data packet: (' + prefix + ',' + expectedLength + ')');
                            if (this.hexdumpCallback) this.hexdumpCallback('('+ connid +') << ' + rxdata + " ##");
                        }
                        this.result = "";

                        if (this.roverHandlers[prefix]) {
                            this.roverHandlers[prefix](rxdata, prefix, expectedLength, actualLength);
                        }
                    }
                }

            }
            else {
                // if (this.logCallback) this.logCallback('('+ connid +')  0xFF 0xD9 not received yet, continuing to wait', true);
                // chrome.serial.flush(connid, function (result) {
                //     if (this.logCallback) this.logCallback('('+ connid +') flush completed: ' + result, true);
                // }.bind(this));
                return;
            }

        }.bind(this)); // convertArrayBufferToString()

    }.bind(this);

    if (info && info.socketId == connid) {
        if (this.robotMode == 'command') {
            handleReceiveCommandMode(info);
        }
        else if (this.robotMode == 'rover') {
            handleReceiveRoverMode(info);
        }
        else {
            if (this.logCallback) this.logCallback('data received with invalid robot mode');
        }
    }
    else {
        if (this.logCallback) this.logCallback('data received but connectionid was not bound');
    }
}

JadeRobot.prototype.handleOnReceiveError = function (info) {
    var connid = this.socket.socketId;
    if (info && info.socketId == connid) {
        chrome.bluetoothSocket.setPaused(connid, true, function () {
            if (info.error == "timeout") {
                if (this.timeoutCallback) this.timeoutCallback();
            }
            else {
                if (this.errorCallback) this.errorCallback(info.error);
            }
        }.bind(this));
    }
}

JadeRobot.prototype.ping = function (pongCallback, timeoutCallback, errorCallback) {
    this.doCommand('*', function (rxdata) {
        if (rxdata == '-*') {
            pongCallback();
        }
    }, timeoutCallback, errorCallback);
}

JadeRobot.prototype.dirlist = function (fileList, dirCallback, busyCallback, timeoutCallback, errorCallback) {
    var files = {};
    var fileListIndex = 0;
    var fileListLength = fileList.length;

    var currentFilename = fileList[fileListIndex];

    var onDirOutput = function (rxdata) {
        if (rxdata == 'Script Executing') {
            if (busyCallback) busyCallback();
            return;
        }

        if (rxdata.slice(0, currentFilename.length) == currentFilename) {
            var filename = rxdata.slice(0,12).trim();
            var filesize = Number(rxdata.slice(13,19).trim());
            var filesum = rxdata.slice(26,32);
            var filetype = filetypemap[filename.slice(filename.indexOf('.') + 1)];
            // var filehidden = (filename.charAt(0) == '_');
            // files are never hidden when they are specifically queried
            var filehidden = false;
            // if (this.logCallback) this.logCallback('dir info: /' + filename + "/" + filesize + "/" + filesum + "/");
            files[filename] = {
                'name': filename,
                'type': filetype,
                'size': filesize,
                'checksum': filesum,
                'content-crc': parseInt(filesum),
                'hidden': filehidden
            }
        }

        fileListIndex++;
        if (fileListIndex < fileList.length) {
            currentFilename = fileList[fileListIndex];
            var dircmd = 'dir ' + currentFilename;
            return this.doCommand(dircmd, onDirOutput, timeoutCallback, errorCallback);
        }
        else {
            return dirCallback(files);
        }
        
    }.bind(this);

    if (fileListIndex < fileList.length) {
        var dircmd = 'dir ' + currentFilename;
        this.doCommand(dircmd, onDirOutput, timeoutCallback, errorCallback);
    }
}

JadeRobot.prototype.dir = function (dirCallback, busyCallback, timeoutCallback, errorCallback) {
    var files = {};

    var onDirOutput = function (rxdata) {
        if (rxdata != '') {
            if (rxdata == 'Script Executing') {
                if (busyCallback) busyCallback();
                return;
            }

            var filename = rxdata.slice(0,12).trim();
            var filesize = Number(rxdata.slice(13,19).trim());
            var filesum = rxdata.slice(26,32);
            var filetype = filetypemap[filename.slice(filename.indexOf('.') + 1)];
            var filehidden = (filename.charAt(0) == '_');
            files[filename] = {
                'name': filename,
                'type': filetype,
                'size': filesize,
                'checksum': filesum,
                'content-crc': parseInt(filesum),
                'hidden': filehidden
            }
            return this.doCommand('dirnxt', onDirOutput, timeoutCallback, errorCallback);
        }
        else {
            return dirCallback(files);
        }
    }.bind(this);

    this.doCommand('dir', onDirOutput, timeoutCallback, errorCallback);
}

JadeRobot.prototype.vardump = function(vardumpCallback, timeoutCallback, errorCallback) {
    var vars = {};

    var onVardumpOutput = function (rxdata) {

        if (rxdata != '') {
            if (rxdata == 'Script Executing') {
                return errorCallback(rxdata);
            }

            var varfullname = rxdata.slice(0,34).trim();
            var varname = rxdata.slice(0,30).trim();
            var vartype = (rxdata.length >= 38 && rxdata.charAt(37) == '"') ? "String" : "Integer";
            var vararray = (rxdata.charAt(30) == '[' && rxdata.charAt(33) == ']');
            var vararrayindex = (vararray) ? rxdata.slice(31,33) : '';
            var varvalue = (vartype == "String") ? '"' : '';
            var onVardumpDataOutput = function (rxdata) {
                // if the last character is a tab, this is the end of the string
                if (rxdata.charCodeAt(rxdata.length - 1) == 9) {
                    varvalue += rxdata.slice(0,-1);
                    vars[varname] = {
                        'name': varname,
                        'fullname': varfullname,
                        'type': vartype,
                        'isArray': vararray,
                        'arrayIndex': vararrayindex,
                        'value': varvalue
                    };
                    this.doCommand('vardumpnxt', onVardumpOutput, timeoutCallback, errorCallback);
                }
                else {
                    // otherwise, append and keep reading
                    varvalue += rxdata;
                    this.doCommand('vardumpnxt', onVardumpDataOutput, timeoutCallback, errorCallback);
                }
            }.bind(this);
            this.doCommand('vardumpnxt', onVardumpDataOutput, timeoutCallback, errorCallback);
        }
        else {
            // if we only received a '\r' (that was stripped by doCommand), we are done
            vardumpCallback(vars);
        }

    }.bind(this);

    this.doCommand('vardump', onVardumpOutput, timeoutCallback, errorCallback);
}

JadeRobot.prototype.download = function (fileName, fileData, downloadCallback, timeoutCallback, errorCallback) {
    var fileSize = fileData.byteLength;
    var fileArray = new Uint8Array(fileData);
    var downloadCmd = 'download ' + fileName + ' ' + fileSize;
    var chunkOffset = 0;

    this.doCommand(downloadCmd, function (rxdata) {

        if (rxdata == '') {

            var blockCallback = function() {

                var blockCommand = "block ";
                for (var i = 0; i < 16; i++) {
                    var fileIndex = chunkOffset + i;
                    if (fileIndex < fileSize) {
                        blockCommand += byteToHexString(fileArray[fileIndex]);
                        if (i < 15 && fileIndex < (fileSize - 1)) blockCommand += ' ';
                    }
                }
                chunkOffset += 16;
                var endOfTransfer = (chunkOffset >= fileSize);
                this.doCommand(blockCommand, function (rxdata) {
                    if (rxdata == '') {
                        if (!endOfTransfer) {
                            blockCallback();
                        }
                        else {
                            if (errorCallback) errorCallback("Download Sync Error");
                        }
                    }
                    else if (rxdata == "Download Complete") {
                        if (endOfTransfer) {
                            if (downloadCallback) downloadCallback();
                        }
                        else {
                            if (errorCallback) errorCallback("Download Sync Error");
                        }
                    }
                    else {
                        if (this.logCallback) this.logCallback('download block error: ' + rxdata);
                    }
                }.bind(this), timeoutCallback, errorCallback);

            }.bind(this);

            blockCallback();

        }
        else {
            if (this.logCallback) this.logCallback('download error: ' + rxdata);
            if (errorCallback) errorCallback(rxdata);
        }

    }.bind(this), timeoutCallback, errorCallback);
}

JadeRobot.prototype.stepin = function (resultCallback, timeoutCallback, errorCallback) {
    var onErrorOutput = function (rxdata) {
        if (rxdata == '') {
            if (errorCallback) errorCallback(rxdata);
        }
        else {
            this.doCommand('errmsgnxt', onErrorOutput, timeoutCallback, errorCallback);
        }
    }.bind(this);

    this.doCommand('stepin', function (rxdata) {
        if (rxdata.substr(0,5) == 'Error') {
            onErrorOutput(rxdata);
        }
        else {
            if (rxdata.length > 18) {
                var scriptname = rxdata.slice(0,12).trim();
                var scriptline = Number(rxdata.slice(13,19).trim());
                var stepInfo = {
                    'name': scriptname,
                    'line': scriptline
                };
                if (resultCallback) resultCallback(stepInfo)
            }
            else {
                if (resultCallback) resultCallback();
            }
        }
    }.bind(this), timeoutCallback, errorCallback);
}

JadeRobot.prototype.load = function (scriptName, resultCallback, timeoutCallback, errorCallback) {
    this.doCommand('load ' + scriptName, function (rxdata) {

        if (rxdata.length > 18) {
            var scriptname = rxdata.slice(0,12).trim();
            var scriptline = Number(rxdata.slice(13,19).trim());
            var stepInfo = {
                'name': scriptname,
                'line': scriptline
            };
            if (resultCallback) resultCallback(stepInfo)
        }
        else {
            if (errorCallback) errorCallback(rxdata);
        }

    }, timeoutCallback, errorCallback);
}

JadeRobot.prototype.reset = function (resultCallback, timeoutCallback, errorCallback) {
    this.doCommand('reset', function (rxdata) {

        if (rxdata.length > 18) {
            var scriptname = rxdata.slice(0,12).trim();
            var scriptline = Number(rxdata.slice(13,19).trim());
            var stepInfo = {
                'name': scriptname,
                'line': scriptline
            };
            if (resultCallback) resultCallback(stepInfo)
        }
        else {
            if (errorCallback) errorCallback(rxdata);
        }

    }, timeoutCallback, errorCallback);
}


const scriptStatusMap = {
    "NOPGM": 'No Program',
    "READY": 'Ready',
    "RUN'G": 'Running',
    "ERROR": 'Error Halt',
    "DONE ": 'Finished',
    "SYNCH": 'Synchronizing',
    "DELAY": 'Application Delay'
};

function parseStatus(rxdata) {
    var scriptname = rxdata.slice(0,8).trim();
    var scriptaddr = rxdata.slice(9,19);
    var scriptline = Number(rxdata.slice(20,26).trim());
    var scriptstatusraw = rxdata.slice(27,32);
    var scriptstatus = scriptStatusMap[scriptstatusraw];
    var haltStatus = {
        'name': scriptname,
        'addr': scriptaddr,
        'line': scriptline,
        'status': scriptstatus,
        'statid': scriptstatusraw
    };
    return haltStatus;
}

JadeRobot.prototype.halt = function (resultCallback, timeoutCallback, errorCallback) {
    this.doCommand('halt', function (rxdata) {
        if (rxdata != 'ctrl-C') {
            var haltStatus = parseStatus(rxdata);
            if (resultCallback) resultCallback(haltStatus)
        }
        else {
            if (resultCallback) resultCallback({});
        }
    }, timeoutCallback, errorCallback);
}

JadeRobot.prototype.status = function (resultCallback, timeoutCallback, errorCallback) {
    this.doCommand('status', function (rxdata) {
        var haltStatus = parseStatus(rxdata);
        if (resultCallback) resultCallback(haltStatus)
    }, timeoutCallback, errorCallback);
}

function createGetterOverrideTimeout(command, timeout) {
    return (function (resultCallback, timeoutCallback, errorCallback) {
        this.doCommand(command, resultCallback, timeoutCallback, errorCallback, timeout);
    });
}

function createGetter(command) {
    return (function (resultCallback, timeoutCallback, errorCallback) {
        this.doCommand(command, resultCallback, timeoutCallback, errorCallback);
    });
}

function createSetterOverrideTimeout(command, timeout) {
    return (function (value, resultCallback, timeoutCallback, errorCallback) {
        this.doCommand(command + ' ' + value, resultCallback, timeoutCallback, errorCallback, timeout);
    });
}

function createSetter(command) {
    return (function (value, resultCallback, timeoutCallback, errorCallback) {
        this.doCommand(command + ' ' + value, resultCallback, timeoutCallback, errorCallback);
    });
}

// all the straight passthrough commands
// some of these may be replaced down the road with more structured implementations
JadeRobot.prototype.version = createGetter('ver');
JadeRobot.prototype.hwversion = createGetter('hwver');
JadeRobot.prototype.btser = createGetter('btser');
JadeRobot.prototype.resume = createGetter('resume');
JadeRobot.prototype.stepover = createGetter('stepover');
JadeRobot.prototype.stepout = createGetter('stepout');
JadeRobot.prototype.avail = createGetter('avail');
JadeRobot.prototype.batlevel = createGetter('batlevel');
JadeRobot.prototype.getname = createGetter('getname');
JadeRobot.prototype.garbage = createGetterOverrideTimeout('garbage', 5000);

JadeRobot.prototype.del = createSetter('del');
JadeRobot.prototype.showbmp = createSetter('showbmp');
JadeRobot.prototype.panelload = createSetter('panelload');
JadeRobot.prototype.playwav = createSetter('play');
JadeRobot.prototype.setvol = createSetter('setvol');

JadeRobot.prototype.camon = createGetterOverrideTimeout('camon', 5000);
JadeRobot.prototype.camoff = createGetter('camoff');
JadeRobot.prototype.camstatus = createGetterOverrideTimeout('camstatus', 5000);

JadeRobot.prototype.camshoot = function (resultCallback, timeoutCallback, errorCallback) {
    this.doSingleRoverCommand('camshoot', 'jpeg', resultCallback, timeoutCallback, errorCallback);
}

function createRoverGetter(command, packethdr) {
    return (function (resultCallback, timeoutCallback, errorCallback) {
        this.doRoverCommand(command, packethdr, resultCallback, timeoutCallback, errorCallback);
    });
}

function createRoverSetter(command, packethdr) {
    return (function (value, resultCallback, timeoutCallback, errorCallback) {
        this.doRoverCommand(command + ' ' + value, packethdr, resultCallback, timeoutCallback, errorCallback);
    });
}

JadeRobot.prototype.roverstart = function (resultCallback, packetCallback, timeoutCallback, errorCallback) {
    this.startRoverMode(resultCallback, packetCallback, timeoutCallback, errorCallback);
}
JadeRobot.prototype.roverstop = function (resultCallback, timeoutCallback, errorCallback) {
    this.stopRoverMode(resultCallback, timeoutCallback, errorCallback);
}

JadeRobot.prototype.roverstat = function (resultCallback, timeoutCallback, errorCallback) {
    this.doSingleRoverCommand('roverstat', 'stat', resultCallback, timeoutCallback, errorCallback);
}
JadeRobot.prototype.spectro = createRoverGetter('spectro', 'spec');
JadeRobot.prototype.btledon = createRoverSetter('btledon', null);
JadeRobot.prototype.btledoff = createRoverSetter('btledoff', null);
JadeRobot.prototype.setleftmtr = createRoverSetter('setleftmtr', null);
JadeRobot.prototype.setritemtr = createRoverSetter('setritemtr', null);
JadeRobot.prototype.servoon = createRoverGetter('servoon', null);
JadeRobot.prototype.servooff = createRoverGetter('servooff', null);
JadeRobot.prototype.servocntr = createRoverGetter('servocntr', null);
JadeRobot.prototype.servoclose = createRoverGetter('servoclose', null);
JadeRobot.prototype.servoopen = createRoverGetter('servoopen', null);
JadeRobot.prototype.servoup = createRoverGetter('servoup', null);
JadeRobot.prototype.servodown = createRoverGetter('servodown', null);
JadeRobot.prototype.camres = createRoverSetter('camres', null);
JadeRobot.prototype.gripset = createRoverSetter('gripset', null);
JadeRobot.prototype.eleset = createRoverSetter('eleset', null);
JadeRobot.prototype.exp1pwron = createRoverGetter('exp1pwron', null);
JadeRobot.prototype.exp1pwroff = createRoverGetter('exp1pwroff', null);
JadeRobot.prototype.exp2pwron = createRoverGetter('exp2pwron', null);
JadeRobot.prototype.exp2pwroff = createRoverGetter('exp2pwroff', null);
