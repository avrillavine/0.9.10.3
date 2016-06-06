// a4-authrest.js

    function authPOSTTextReturnText(authurl, reqtext, successCallback, errorCallback) {

        function requestReturn() {
            var responseData = this.response;
            if (successCallback) successCallback(responseData);
        }

        refreshUserToken(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', authurl);
            xhr.responseType = 'text';
            xhr.setRequestHeader('Authorization', 'Bearer ' + userToken);
            xhr.onload = requestReturn;
            xhr.send(reqtext);
        }, function () {
            printAppLog("POST failed: " + authurl);
            if (errorCallback) errorCallback();
        })

    }

    function authPOSTTextReturnBinary(authurl, reqtext, successCallback, errorCallback) {
        
        function requestReturn() {
            if (this.status == 200) {
                var responseData = this.response;
                if (successCallback) successCallback(responseData);                
            }
            else {
                var responseCode = this.status;
                arrayBufferToString(this.response, function (errorText) {
                    if (errorCallback) errorCallback(responseCode, errorText);
                });
            }
        }

        refreshUserToken(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', authurl);
            xhr.responseType = 'arraybuffer';
            xhr.setRequestHeader('Authorization', 'Bearer ' + userToken);
            xhr.onload = requestReturn;
            xhr.send(reqtext);
        }, function () {
            printAppLog("POST failed: " + authurl);
            if (errorCallback) errorCallback();
        })

    }

    function authPOSTBinaryReturnText(authurl, reqbuffer, successCallback, errorCallback) {
        
        function requestReturn() {
            if (this.status == 200) {
                var responseData = this.response;
                if (successCallback) successCallback(responseData);
            }
            else {
                var responseCode = this.status;
                var errorText = this.response;
                if (errorCallback) errorCallback(responseCode, errorText);
            }
        }

        refreshUserToken(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', authurl);
            xhr.responseType = 'text';
            xhr.setRequestHeader('Authorization', 'Bearer ' + userToken);
            xhr.onload = requestReturn;
            xhr.send(reqbuffer);
        }, function () {
            printAppLog("POST failed: " + authurl);
            if (errorCallback) errorCallback();
        })

    }

    function authGETJSON(authurl, successCallback, errorCallback) {
        if (userToken) {
            $.ajax({
                type: 'GET',
                url: authurl,
                dataType: 'json',
                headers: {'Authorization': 'Bearer ' + userToken},
                success: successCallback,
                error: errorCallback
            });
        }
    }

    function authGETText(authurl, successCallback, errorCallback) {
        if (userToken) {
            $.ajax({
                type: 'GET',
                url: authurl,
                dataType: 'text',
                headers: {'Authorization': 'Bearer ' + userToken},
                success: successCallback,
                error: errorCallback
            });
        }
    }

    function authGETBinary(authurl, successCallback, errorCallback) {

        function requestReturn() {
            var responseData = this.response;
            if (successCallback) successCallback(responseData);
        }

        refreshUserToken(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', authurl);
            xhr.responseType = 'arraybuffer';
            xhr.setRequestHeader('Authorization', 'Bearer ' + userToken);
            xhr.onload = requestReturn;
            xhr.send();
        }, function () {
            printAppLog("GET failed: " + authurl);
            if (errorCallback) errorCallback();
        })

    }

    function authPUTJSON(authurl, jsonData, successCallback, errorCallback) {
        if (userToken) {
            $.ajax({
                type: 'PUT',
                url: authurl,
                data: jsonData,
                dataType: 'json',
                headers: {'Authorization': 'Bearer ' + userToken},
                success: successCallback,
                error: errorCallback
            });
        }
    }

    function authPUTText(authurl, textData, successCallback, errorCallback) {
        if (userToken) {
            $.ajax({
                type: 'PUT',
                url: authurl,
                data: textData,
                processData: false,
                headers: {'Authorization': 'Bearer ' + userToken},
                success: successCallback,
                error: errorCallback
            });
        }
    }

    function authPUTBinary(authurl, arrayBuffer, successCallback, errorCallback) {
        
        function requestReturn() {
            var responseData = this.response;
            if (successCallback) successCallback(responseData);
        }

        refreshUserToken(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('PUT', authurl);
            xhr.responseType = 'text';
            xhr.setRequestHeader('Authorization', 'Bearer ' + userToken);
            xhr.onload = requestReturn;
            xhr.send(arrayBuffer);
        }, function () {
            printAppLog("PUT failed: " + authurl);
            if (errorCallback) errorCallback();
        })

    }

    function authDELETE(authurl, successCallback, errorCallback) {

        refreshUserToken(function() {
            $.ajax({
                type: 'DELETE',
                url: authurl,
                dataType: 'json',
                headers: {'Authorization': 'Bearer ' + userToken},
                success: successCallback,
                error: errorCallback
            });
        }, function () {
            printAppLog("DELETE failed, couldn't refresh token: " + authurl);
            if (errorCallback) errorCallback();
        })

    }
