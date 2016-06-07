// auth.js

var jadeIde = angular.module('jade-ide');

jadeIde.factory('GitHubAuthService', ['$rootScope', '$q', 'LogService', '$http', function ($rootScope, $q, LogService, $http) {

    const loginUrl = 'https://userdata.cloud.mimetics.ca/api/v1/authenticate';
    const clientId = '7fea53030d25c45549bc';
    var redirectUri = chrome.identity.getRedirectURL('provider_cb');
    var redirectRe = new RegExp(redirectUri + '[#\?](.*)');
    var access_token = null;

    return { 

        // replace clientId with the value obtained by you for your
        // application https://github.com/settings/applications. 

        getToken: function (interactive) {

            var deferred = $q.defer();

            // In case we already have an access_token cached, simply return it.
            if (access_token) {
                deferred.resolve(access_token);
                return deferred.promise;
            }

            var options = {
                'interactive': interactive,
                url:'https://github.com/login/oauth/authorize?client_id=' + clientId +
                    '&reponse_type=token' +
                    '&access_type=online' +
                    '&scope=user,repo,delete_repo' +
                    '&redirect_uri=' + encodeURIComponent(redirectUri)
            };

            chrome.identity.launchWebAuthFlow(options, function(redirectUri) {

                LogService.debugLogMsg('launchWebAuthFlow completed', chrome.runtime.lastError, redirectUri);

                if (chrome.runtime.lastError) {
                    deferred.reject(chrome.runtime.lastError.message);
                    return;
                }

                // Upon success the response is appended to redirectUri, e.g.
                // https://{app_id}.chromiumapp.org/provider_cb#access_token={value}
                //     &refresh_token={value}
                // or:
                // https://{app_id}.chromiumapp.org/provider_cb#code={value}
                var matches = redirectUri.match(redirectRe);
                if (matches && matches.length > 1) {
                    handleProviderResponse(parseRedirectFragment(matches[1]));
                }
                else {
                    deferred.reject('Invalid redirect URI: ' + redirectUri);
                }

            });

            function parseRedirectFragment(fragment) {
                var pairs = fragment.split(/&/);
                var values = {};

                pairs.forEach(function(pair) {
                    var nameval = pair.split(/=/);
                    values[nameval[0]] = nameval[1];
                });

                return values;
            }

            function handleProviderResponse(values) {
                LogService.debugLogMsg('Provider Response: ' + values);
                if (values.hasOwnProperty('access_token')) {
                    setAccessToken(values.access_token);
                }
                // If response does not have an access_token, it might have the code,
                // which can be used in exchange for token.
                else if (values.hasOwnProperty('code')) {
                    exchangeCodeForToken(values.code);
                }
                else 
                    deferred.reject('Neither access_token nor code avialable.');
            }

            function exchangeCodeForToken(code) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', loginUrl + '/' + code);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = function () {
                    // When exchanging code for token, the response comes as json, which
                    // can be easily parsed to an object.
                    if (this.status === 200) {
                        var response = JSON.parse(this.responseText);
                        LogService.debugLogMsg('Code exchange response:');
                        LogService.debugLogMsg(response);
                        if (response.hasOwnProperty('access_token')) {
                            setAccessToken(response.access_token);
                        } else {
                            deferred.reject('Cannot obtain access_token from code.');
                        }
                    } else {
                        LogService.debugLogMsg('Code exchange status:', this.status);
                        deferred.reject('Code exchange failed');
                    }
                };
                xhr.send();
            }

            function setAccessToken(token) {
                access_token = token; 
                LogService.debugLogMsg('Setting access_token: ' + access_token);
                deferred.resolve(access_token);
            }

            return deferred.promise;
        },

        removeCachedToken: function(token_to_remove) {
            if (access_token == token_to_remove) {
                $http({method: 'GET', url: 'https://userdata.cloud.mimetics.ca/api/v1/logout/' + access_token}).
                    success(function(data, status, headers, config) {
                        //
                    }).
                    error(function(data, status, headers, config) {
                        //
                    });
                
                access_token = null;
            }
        }

    }; 

}]);

jadeIde.factory('GoogleAuthService', ['', function () {


    function onLoggedIn(info) {
        userInfo = info;
        userId = userInfo.sub;

        printAppLog('user authentication complete, user id: ' + userId);
        setupAccountControls();

        configureContextMenus(function () {
            chrome.contextMenus.onClicked.addListener(contextMenuListener);
            doUserRegistration();
        });
    }

    function onLoggedOut() {
        userToken = null;
        userInfo = null;

        if (userDiv.firstChild) {
            userDiv.replaceChild(document.createTextNode('Log in'), userDiv.firstChild);
        }
        else {
            userDiv.appendChild(document.createTextNode('Log in'));
        }
        $("#user-login").popover('destroy');
    }

    function onGetAuthToken(token) {

        var retry = true;

        function onUserInfoSuccess(data, status) {
            onLoggedIn(data);
        }

        function onUserInfoFailure() {
            printAppLog("User login failure.")
            onLoggedOut();
        }

        function onUserTokenInvalid() {
            if (retry) {
                retry = false;
                chrome.identity.removeCachedAuthToken({ token: userToken }, function() {
                    chrome.identity.getAuthToken({'interactive': true}, function (token) {
                        userToken = token;
                        requestUserInfo();
                    });                
                });
            }
        }

        function requestUserInfo() {
            $.ajax({
                url: 'https://www.googleapis.com/oauth2/v3/userinfo',
                dataType: 'json',
                headers: {'Authorization': 'Bearer ' + token},
                statusCode: {
                    401: onUserTokenInvalid,
                    500: onUserInfoFailure
                },
                success: onUserInfoSuccess,
                error: onUserInfoFailure
            });
        }

        if (!token) {
            userDiv.appendChild(document.createTextNode('Log in'));
            return;
        }
        else {
            userToken = token;
            requestUserInfo();
        }

    }

    function userLogout() {
        $.get('https://accounts.google.com/o/oauth2/revoke?token=' + userToken, function (data, status) {
            chrome.identity.removeCachedAuthToken({token: userToken}, onLoggedOut);
        });
    }

    function getUserInfo() {
        chrome.identity.getAuthToken({'interactive': false}, onGetAuthToken);
    }

    function getUserInfoInteractive() {
        chrome.identity.getAuthToken({'interactive': true}, onGetAuthToken);
    }

    $("#user-login")
        .click(function() {
            if (!userToken) {
                getUserInfoInteractive();
            }
        });

    function refreshUserToken(successCallback, errorCallback) {

        function onRefreshAuthToken(token) {
            if (!token) {
                printAppLog("Could not refresh user token!");
                if (errorCallback) errorCallback();
            }
            else {
                userToken = token;
                if (successCallback) successCallback();
            }
        }

        chrome.identity.getAuthToken({'interactive': false}, onRefreshAuthToken);

    }

    function setupAccountControls() {
        if (userDiv.firstChild) {
            userDiv.replaceChild(document.createTextNode(userInfo.email), userDiv.firstChild);
        }
        else {
            userDiv.appendChild(document.createTextNode(userInfo.email));
        }

        $("#user-login").popover({
            placement: 'bottom',
            html: true,
            title: 'Logged In',
            content: '<button type="button" class="btn btn-primary" id="user-logout">Log Out</button>'
        });
        $("#user-login").on("shown.bs.popover", function () {
            $("#user-logout").click(function() {
                userLogout();
            });
        });        
    }

    return function name(){
        
    };

}]);
