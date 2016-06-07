chrome.app.runtime.onLaunched.addListener(function() {
    new commHandler();
});

var commHandler = function() {
    var connectedSocketId = 0;
    var btSelectUpdateCallback = null;
    chrome.app.window.create(
      'ide-main.html', {
        frame: "none",
        bounds: {      	
          width: 1600,
          height: 900
        },
        minWidth: 1024,
        minHeight: 768,
        state: "normal",
        id: "jade-ide-main",
        singleton: true
      },
      function(win) {
        win.contentWindow.setConnectedSocketId = function(id) {
          connectedSocketId = id;
        };
        win.contentWindow.getConnectedSocketId = function() {
          return connectedSocketId;
        };
        win.contentWindow.setUpdateBTSelected = function(callback) {
          btSelectUpdateCallback = callback;
        };
        win.contentWindow.getUpdateBTSelected = function() {
          return btSelectUpdateCallback;
        };
        win.onClosed.addListener(function() {
          chrome.bluetooth.stopDiscovery(function() {});
          if (0 != connectedSocketId) {
            chrome.bluetoothSocket.disconnect(connectedSocketId, function () {
            });
          }
        });
      }
    );
}
