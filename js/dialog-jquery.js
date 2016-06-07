//  Implement Simple "Window. ..." Functions for use in Chrome Apps
//

var buttonClicked = false;
var buttonResult  = null;

function alertDialogMix(title, message, closeCallback) {
    title = title || "Alert...";

    var deferred = Q.defer();
    $('<div title="' + title + '">' +
                                    "<table>" +
                                    "  <col style=\"width:30%\">" +
                                    "  <col style=\"width:70%\">" +
                                    "  <tbody>" +
                                    "    <td><img src=\"img/exclaim.png\"></td>" +
                                    "    <td><p>" + message + "</p></td>" +
                                    "  </tbody>" +
                                    "</table>" +
                                    '</div>').dialog({
        modal: true,
        width: 400,
        position: {
            my: "center top",
            at: "center top",
            of: window
        },
        buttons: [{
            // The OK button
            text: "OK",
            click: function () {
                $(this).dialog("close");
            }
        }],
        close: function (event, ui) {
            // Destroy the jQuery UI dialog and remove it from the DOM
            $(this).dialog("destroy").remove();
            
            // If the promise has not yet been resolved (eg the user clicked the close icon) 
            // then resolve the promise as false indicating the user did *not* click "OK"
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
            buttonClicked = true;
            closeCallback();
        }
    });

    return deferred.promise;
}
function alertDoSomething(message) {
    function alertDialogCallback() {
        buttonClicked = true;
    }

    alertDialogMix("", message, alertDialogCallback);
    
}
function alertDialogAttempt1(message) {
    
    alertDoSomething(message);

    buttonClicked = false;
    
    var alertInterval = setInterval(function() {
        if (buttonClicked) {
            clearInterval(alertInterval);
        }
    }, 100);
}
function alertDialogAttempt2(message) {
    
    var dfrd = $.Deferred();
   
    alertDialogMix("", message, function() {
        dfrd.resolve();
    });
    return dfrd.promise();  
}
function alertDialogAttempt3(message) {
    
    var dfrd = $.Deferred();

    function alertDialogAttempt3Callback() {
        dfrd.notify();
    }
   
    alertDialogMix("", message, alertDialogAttempt3Callback);
    
    
    $.when(dfrd).then();  
}



function confirmDialogMix(title, message, closeCallback) {
    title = title || "Confirm...";
    
    var returnValue = "close";

    var deferred = Q.defer();
    $('<div title="' + title + '">' +
                                    "<table>" +
                                    "  <col style=\"width:30%\">" +
                                    "  <col style=\"width:70%\">" +
                                    "  <tbody>" +
                                    "    <td><img src=\"img/quest.png\"></td>" +
                                    "    <td><p>" + message + "</p></td>" +
                                    "  </tbody>" +
                                    "</table>" +
                                    '</div>').dialog({
        modal: true,
        width: 400,
        position: {
            my: "center top",
            at: "center top",
            of: window
        },
        buttons: [{
            // The OK button
            text: "OK",
            click: function () {
                returnValue = "OK";
                $(this).dialog("close");
            }
        }, {
            // The Cancel button
            text: "Cancel",
            click: function () {
                returnValue = "cancel";
                $(this).dialog("close");
            }
        }],
        close: function (event, ui) {
            // Destroy the jQuery UI dialog and remove it from the DOM
            $(this).dialog("destroy").remove();
            
            // If the promise has not yet been resolved (eg the user clicked the close icon) 
            // then resolve the promise as false indicating the user did *not* click "OK"
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
            closeCallback(returnValue);
        }
    });

    return deferred.promise;
}


function promptDialogMix(title, message, originalText, closeCallback) {
    title = title || "Prompt...";
    
    var returnValue = "";

    var deferred = Q.defer();
    $('<div title="' + title + '">' +
                                    "<p>" + message + "</p>" +
                                    "<input type=\"text\" name=\"__prompt\" value=" + originalText + ">" +
                                    '</div>').dialog({
        modal: true,
        width: 400,
        position: {
            my: "center top",
            at: "center top",
            of: window
        },
        buttons: [{
            // The OK button
            text: "OK",
            click: function () {
                returnValue = $("input:text").val();
                $(this).dialog("close");
            }
        }, {
            // The Cancel button
            text: "Cancel",
            click: function () {
                $(this).dialog("close");
            }
        }],
        close: function (event, ui) {
            // Destroy the jQuery UI dialog and remove it from the DOM
            $(this).dialog("destroy").remove();
            
            // If the promise has not yet been resolved (eg the user clicked the close icon) 
            // then resolve the promise as false indicating the user did *not* click "OK"
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
            closeCallback(returnValue);
        }
    });

    return deferred.promise;
}





function confirmar(titulo, msg, elemento) {
//  From: http://stackoverflow.com/questions/436608/can-you-wait-for-javascript-callback

    if ($(elemento).attr('sim')) {      
        $(elemento).removeAttr('sim');      
        return true;
    } else if ($(elemento).attr('nao')) {       
        $(elemento).removeAttr('nao');      
        return false;
    } else {
//        $("#dialog-confirm").html('<p>' + msg + '</p>').dialog({
        $('<div title="' + titulo + '">' +
                                    "<p>" + msg + "</p>" +
                                    '</div>').dialog({
            resizable : false,
            height : 200,
            modal : true,
            title : titulo,
            buttons : {
                "Sim" : function() {
                    $(this).dialog("close");
                    $(elemento).attr('sim', 'sim');
                    $(elemento).click();
                },
                "Nao" : function() {
                    $(this).dialog("close");
                    $(elemento).attr('nao', 'nao');
                    $(elemento).click();
                }
            }
        });
    }

    return false;
}



