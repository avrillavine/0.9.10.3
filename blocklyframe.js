// blocklyframe.js

blocklyMessageHandlers = {
    setBlocklyXML: function setBlocklyXML(arg) {
        var xml = Blockly.Xml.textToDom(arg);
        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
    },
    setBlocklyHighlight: function setBlocklyHighlight (arg) {
        var blockId = arg;
        Blockly.mainWorkspace.traceOn(true);
        Blockly.mainWorkspace.highlightBlock(blockId);
    },
    clearBlocklyHighlight: function clearBlocklyHighlight (arg) {
        Blockly.mainWorkspace.traceOn(true);
        Blockly.mainWorkspace.highlightBlock(null);
    }
}

function receiveMessage(event) {
    var eventData = event.data;
    var handlerMethod = blocklyMessageHandlers[eventData.method];
    var arg = eventData.arg;

    if (handlerMethod) {
        handlerMethod(arg);
    }
}

function onBlocklyChanged() {
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlDump = Blockly.Xml.domToPrettyText(xml);
    window.parent.postMessage({method: 'onBlocklyChanged', arg: xmlDump}, '*');
}

function onBlocklyLoaded() {
    window.parent.postMessage({method: 'onBlocklyLoaded'}, '*');
}

function init() {
    Blockly.inject(document.body, {path: '../../', toolbox: document.getElementById('toolbox')});
    Blockly.addChangeListener(onBlocklyChanged);

    window.addEventListener("message", receiveMessage, false);
    onBlocklyLoaded();
}
