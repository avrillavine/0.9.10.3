function extractFilenameExtension(filename) {
	return filename.slice(filename.indexOf('.') + 1);
}

function byteToHexString (bytevalue) {
	var hexString = bytevalue.toString(16);
	var z = 2 - hexString.length + 1;
    hexString = Array(z).join("0") + hexString;
    return hexString;
}

function mangleFilename(unmangledFilename) {
	var mangledFilename = unmangledFilename.replace(/\./g, '$');
	return mangledFilename;
}

function demangleFilename(mangledFilename) {
	var unmangledFilename = mangledFilename.replace('\$', '.');
	return unmangledFilename;
}

function normalizeFilenameExtension(filename) {
    var filenameParts = filename.split('.');
    var basename = filenameParts[0];
    var extname = filenameParts[1];
    var normalizedFilename = basename + '.' + extname.toLowerCase();
    return normalizedFilename;
}

function getFilenameBase(filename) {
	return filename.split('.')[0];
}

function getFilenameExtension(filename) {
	return filename.split('.')[1];
}

function writeToClipboard(copyText) {
	var copyDiv = $('<div></div>').attr('contenteditable','true');
	copyDiv.addClass("clipboard-scratchpad");
	copyDiv.appendTo($('#app-content'));
	copyDiv.html(copyText);
    copyDiv.focus();
    document.execCommand('selectall');
    document.execCommand("copy", false, null);
    copyDiv.remove();
}