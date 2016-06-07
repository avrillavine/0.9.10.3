// loggerservices.js

var jadeIde = angular.module('jade-ide');

jadeIde.factory('LogService', ['$rootScope', '$log', function($rootScope, $log) {

    var logContent = [];

    function printCommLog(logmsg, detailed) {
        if (!detailed || (userConfig && userConfig.detailedLogging)) {
            commLog.appendChild(document.createTextNode(logmsg + '\n'));
            $("#comm-log").scrollTop($("#comm-log")[0].scrollHeight);
        }
    }

    return {
        appLogMsg: function appLogMsg(msg) {
            logContent.push("APP: " + msg);
            // $log.log(msg);
        },
        commLogMsg: function commLogMsg(msg) {
            logContent.push("COMM: " + msg);
            // $log.log(msg);
        },
        debugLogMsg: function debugLogMsg(msg) {
//            logContent.push("DEBUG: " + msg);
            // $log.log(msg);
        },
        buildLogMsg: function buildLogMsg(msg) {
            logContent.push("BUILD: " + msg);
            // $log.log(msg);
        },
        content: logContent
    };

}]);
