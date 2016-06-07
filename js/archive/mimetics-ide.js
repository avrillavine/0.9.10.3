$(function() {

    function restoreUserConfigState() {
        loadUserConfig(function () {
            printAppLog("loaded saved user configuration")

            // TODO: remove this once everyone who has run the old IDE has updated their settings
            if (userConfig && userConfig.showHiddenFiles) {
                userConfig.showHiddenFiles = false;
                saveUserConfig();
            }

            if (userConfig && userConfig.connectOnStartup) {
                if (userConfig && userConfig.probeForRobot) {
                    return scanForRobot();
                } else {
                    return robotConnect();        
                }
            }

        }, function () {
            printAppLog("error loading saved user configuration")
        });

        loadUserState(function () {
            if (userState.currentProject && userState.currentProject != '') {
                printAppLog("previous project found: " + userState.currentProject + ", loading project data");
                refreshProjectList();
            }
            else {
                printAppLog("no previous project found");
            }
        }, function () {
            printAppLog("error loading saved user state");
        });

    }

    function doUserRegistration() {
        getUserData(function () {
            printAppLog('user registration found, loaded user data');
            restoreUserConfigState();
        }, function (code) {
            if (code == 404) {
                printAppLog('no user account data found, registering account');
                createUser(function () {
                    printAppLog('user account registration complete for user: ' + userId);
                    // TODO: save user profile info to account
                }, function () {
                    printAppLog('user account registration failed');
                });
            } else {
                printAppLog('error loading user account registration');
            }
        });
    }

    var shortcutResume = {
        type: 'down',
        mask: 'f8',
        handler: robotResume
    };

    var shortcutStepIn = {
        type: 'down',
        mask: 'f5',
        handler: robotStepIn
    };

    var shortcutStepOver = {
        type: 'down',
        mask: 'f6',
        handler: robotStepOver
    };

    var shortcutStepOut = {
        type: 'down',
        mask: 'f7',
        handler: robotStepOut
    };

    var shortcutHalt = {
        type: 'down',
        mask: 'esc',
        handler: robotHalt
    };

    var shortcutSave = {
        type: 'down',
        mask: 'ctrl + s',
        handler: saveCurrentSession
    };

    function setupShortcutKeys() {
        KeyboardJS.on(shortcutResume.mask, shortcutResume.handler);
        KeyboardJS.on(shortcutStepIn.mask, shortcutStepIn.handler);
        KeyboardJS.on(shortcutStepOver.mask, shortcutStepOver.handler);
        KeyboardJS.on(shortcutStepOut.mask, shortcutStepOut.handler);
        KeyboardJS.on(shortcutHalt.mask, shortcutHalt.handler);
        KeyboardJS.on(shortcutSave.mask, shortcutSave.handler);
    }

    setupShortcutKeys();

    printAppLog("Jade Support v" + appVersion);
    getUserInfo();

});
