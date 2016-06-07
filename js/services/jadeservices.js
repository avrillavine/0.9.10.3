// jadeservices.js

var jadeIde = angular.module('jade-ide');
var servicesBaseURL = 'https://toksvc.cloud.mimetics.ca'

jadeIde.factory('Builder', [
    '$q',
    'TokenizerService',
    'XmlProcessor',
    'PanelProcessor',
    'BitmapProcessor',
    'WaveProcessor',
    'TextProcessor',
    'errorCatcher',
    'LogService',
    function ($q, TokenizerService, XmlProcessor, PanelProcessor, BitmapProcessor, WaveProcessor, TextProcessor, errorCatcher, LogService) {

        var extensionMap = {
            "xml": { builder: XmlProcessor, inputExtension: 'xml', outputExtension: 's', requestType: "text", responseType: "arraybuffer" },
            "script": { builder: TokenizerService, inputExtension: 'script', outputExtension: 's', requestType: "text", responseType: "arraybuffer" },
            "function": { builder: TokenizerService, inputExtension: 'function', outputExtension: 'f', requestType: "text", responseType: "arraybuffer" },
            "panel": { builder: PanelProcessor, inputExtension: 'panel', outputExtension: 'p', requestType: "text", responseType: "arraybuffer" },
            "txt": { builder: TextProcessor, inputExtension: 'txt', outputExtension: 'txt', requestType: "text", responseType: "text" },
            "bmp": { builder: BitmapProcessor, inputExtension: 'bmp', outputExtension: 'b', requestType: "arraybuffer", responseType: "text" },
            "wav": { builder: WaveProcessor, inputExtension: 'wav', outputExtension: 'w', requestType: "arraybuffer", responseType: "text" }
        }

        var reverseExtensionMap = {
            "s": [ extensionMap['script'], extensionMap['xml'] ],
            "f": [ extensionMap['function'] ],
            "p": [ extensionMap['panel'] ],
            "txt": [ extensionMap['txt'] ],
            "b": [ extensionMap['bmp'] ],
            "w": [ extensionMap['wav'] ]
        }

        return {
            getExtensionMap: function () {
                return extensionMap;
            },
            getReverseExtensionMap: function () {
                return reverseExtensionMap;
            },

            buildFile: function buildFile (projectFile) {
                var deferred = $q.defer();

                var filename = projectFile.$file.name;
                var basename = getFilenameBase(filename)
                var extension = getFilenameExtension(filename);
                var filetype = extensionMap[extension]

                if (filetype) {
                    var builder = filetype.builder;
                    var outputname = basename + '.' + filetype.outputExtension;
                    LogService.buildLogMsg("Building project file: " + filename + " -> " + outputname);
                    if (extensionMap[extension].requestType == "text") {
                        builder.process({}, projectFile.textdata, filename)
                        .then(function (output) {
                            projectFile.output = output;
                            projectFile.outputname = outputname;
                            deferred.resolve();
                        })
                        .catch(function (reason) {
                            var buildErrorText = convertArrayBufferToString(reason.data);
                            var splitErrorText = buildErrorText.split('\n');
                            if (splitErrorText.length > 1) {
                                buildErrorText = splitErrorText[splitErrorText.length - 1];
                            }
                            var errorText = filename + "\n" + buildErrorText;
                            deferred.reject(errorText);
                        });
                    }
                    else {
                        builder.process({}, projectFile.content.data, filename)
                        .then(function (output) {
                            projectFile.output = output;
                            projectFile.outputname = outputname;
                            deferred.resolve();
                        })
                        .catch(function (reason) {
                            var buildErrorText = convertArrayBufferToString(reason.data);
                            var splitErrorText = buildErrorText.split('\n');
                            if (splitErrorText.length > 1) {
                                buildErrorText = splitErrorText[splitErrorText.length - 1];
                            }
                            var errorText = filename + "\n" + buildErrorText;
                            deferred.reject(errorText);
                        });
                    }
                }
                return deferred.promise;
            }
        };

    }

]);

jadeIde.factory('TokenizerService', ['$http', function($http) {

    var tokenizerURL = servicesBaseURL + '/TokenizerService';
    var tokenizerVersionURL = tokenizerURL + '?version';
    var syscallVersionURL = tokenizerURL + '?syscallVersion';

    return {
        process: function (config, data, name) {
            return $http(
                angular.extend(
                {
                    'params': {scriptName: name},
                    'method': 'POST',
                    'data': data,
                    'url': tokenizerURL,
                    'responseType': 'arraybuffer'
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': tokenizerVersionURL,
                'responseType': 'text'
            });
        },
        syscallVersion: function () {
            return $http(
            {
                'url': syscallVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);

jadeIde.factory('XmlProcessor', ['$http', function($http) {

    var xmlProcessorURL = servicesBaseURL + '/XmlProcessor';
    var xmlProcessorVersionURL = xmlProcessorURL + '?version';

    return {
        process: function (config, data) {
            return $http(
                angular.extend(
                {
                    'method': 'POST',
                    'data': data,
                    'url': xmlProcessorURL,
                    'responseType': 'arraybuffer'
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': xmlProcessorVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);

jadeIde.factory('PanelProcessor', ['$http', function($http) {

    var pnlProcessorURL = servicesBaseURL + '/PnlProcessor';
    var pnlProcessorVersionURL = pnlProcessorURL + '?version';

    return {
        process: function (config, data) {
            return $http(
                angular.extend(
                {
                    'method': 'POST',
                    'data': data,
                    'url': pnlProcessorURL,
                    'responseType': 'arraybuffer'
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': pnlProcessorVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);

jadeIde.factory('WaveProcessor', ['$http', function($http) {

    var wavProcessorURL = servicesBaseURL + '/WavProcessor';
    var wavProcessorVersionURL = wavProcessorURL + '?version';

    function parseWavOutput(textWavData) {
        var wavDataLength = (textWavData.length + 1) / 3;
        var wavDataBuffer = new Uint8Array(wavDataLength);
        for (var wavBufferIndex = 0, textWavIndex = 0; wavBufferIndex < wavDataLength; wavBufferIndex++) {
            wavDataBuffer[wavBufferIndex] = parseInt(textWavData.slice(textWavIndex, textWavIndex + 2), 16);
            textWavIndex += 3;
        }
        return wavDataBuffer.buffer;
    }

    return {
        process: function (config, data) {
            return $http(
                angular.extend(
                {
                    'method': 'POST',
                    'headers': {'Content-Type': 'application/octet-stream'},
                    'data': data,
                    'url': wavProcessorURL,
                    'responseType': 'text',
                    'transformRequest': [],
                    'transformResponse': appendTransform($http.defaults.transformResponse, function (value) {
                        return parseWavOutput(value);
                    })
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': wavProcessorVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);

jadeIde.factory('BitmapProcessor', ['$http', function($http) {

    var bmpProcessorURL = servicesBaseURL + '/BmpProcessor';
    var bmpProcessorVersionURL = bmpProcessorURL + '?version';

    function parseBmpOutput(textBmpData) {
        var bmpDataLength = (Math.floor(textBmpData.length / 47) * 16) + Math.floor(((textBmpData.length % 47) + 1) / 3);
        var bmpDataBuffer = new Uint8Array(bmpDataLength);
        for (var bmpBufferIndex = 0, textBmpIndex = 0; bmpBufferIndex < bmpDataLength; ) {
            var chunkStart = textBmpIndex;
            var chunkEnd = Math.min(textBmpIndex + 47, textBmpData.length);
            var chunkSlice = textBmpData.slice(chunkStart, chunkEnd);
            for (var chunkIndex = 0; chunkIndex < (chunkEnd - chunkStart); chunkIndex += 3) {
                bmpDataBuffer[bmpBufferIndex] = parseInt(chunkSlice.slice(chunkIndex, chunkIndex + 2), 16);
                bmpBufferIndex++;
            }
            textBmpIndex = chunkEnd;
        }
        return bmpDataBuffer.buffer;
    }

    return {
        process: function (config, data) {
            return $http(
                angular.extend(
                {
                    'method': 'POST',
                    'data': data,
                    'headers': {'Content-Type': 'application/octet-stream'},
                    'url': bmpProcessorURL,
                    'responseType': 'text',
                    'transformRequest': [],
                    'transformResponse': appendTransform($http.defaults.transformResponse, function (value) {
                        return parseBmpOutput(value);
                    })
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': bmpProcessorVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);

jadeIde.factory('TextProcessor', ['$http', function($http) {

    var txtProcessorURL = servicesBaseURL + '/TxtProcessor';
    var txtProcessorVersionURL = txtProcessorURL + '?version';

    return {
        process: function (config, data) {
            return $http(
                angular.extend(
                {
                    'method': 'POST',
                    'data': data,
                    'url': txtProcessorURL,
                    'responseType': 'arraybuffer',
                    'transformRequest': []
                }, config)
            );
        },
        version: function () {
            return $http(
            {
                'url': txtProcessorVersionURL,
                'responseType': 'text'
            });
        }
    }

}]);





