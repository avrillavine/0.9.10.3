$(function() {

    $('#signupWebview').on("loadstop", function() {
        var webview = $('#signupWebview')[0];
        
        webview.executeScript({ code: "document.getElementsByClassName('header')[0].style.display=\"none\";" });
        webview.executeScript({ code: "document.getElementsByClassName('site-footer')[0].style.display=\"none\";" });
        webview.executeScript({ code: "document.getElementsByClassName('steps')[0].style.display=\"none\";" });        
        webview.executeScript({ code: "document.getElementsByClassName('setup-secondary')[0].style.display=\"none\";" });
        webview.executeScript({ code: "document.getElementsByClassName('tos-info')[0].style.display=\"none\";" });
        webview.executeScript({ code: "document.getElementsByTagName('html')[0].style.overflow=\"hidden\";" });
        webview.executeScript({ code: "document.getElementById('signup_button').onclick=\"window.close()\";" });

        chrome.app.window.current().show();

    });

    $('#signupWebview').on("loadredirect", function() {
        var webview = $('#signupWebview')[0];        
        var clearDataOptions = {};
        var clearDataType = {appcache:true, cookies:true, fileSystems:true, indexedDB:true, localStorage:true, webSQL:true};      
        
        webview.clearData(clearDataOptions, clearDataType);
        window.close();
    });

});
