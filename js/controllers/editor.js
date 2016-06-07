// editor.js

angular.module('jade-ide').controller('EditorController', ['$scope', '$timeout', 'ProjectManager', 'ProjectData', function($scope, $timeout, ProjectManager, ProjectData) {

    var Range = ace.require("ace/range").Range;

    var extensionMap = {
        "xml": "blockly",
        "script": "text",
        "function": "text",
        "panel": "text",
        "md": "markdown",
        "txt": "text",
        "bmp": "image",
        "wav": "sound"
    }

    var contentTypeMap = {
        "text": "partials/texteditor.html",
        "markdown": "partials/markdowneditor.html",
        "blockly": "partials/blocklyeditor.html"
    }

//    var editorTabs = document.getElementById("editor-tabs");
    var nextSessionIndex = 1;

    var editSessions = {};
    var fileSessions = {};
    var currentSession;
//    var editor = ace.edit("editor-instance");
//    var tabTemplate = '<li><a class="editor-selector" id="#{session-id}" href="#editor-tab" data-toggle="tab"><span class="editor-tab-marker hidden">* </span>#{session-tab-name}<button class="close" type="button" style="margin-left: 6px;">&times;</button></a></li>'

    var scriptExecInfo = null;

    $scope.editorTabs = {};
    $scope.fileTabs = {};
    $scope.currentTab = null;

    $scope.readmeState = "Close";
    $scope.readmeEditorTab = {};
    $scope.readmeEditorActive = false;
    $scope.readmeDirty = false;

    $scope.editReadme = function (project) {
        ProjectManager.getProjectFile(project.$project, project['README.md'].$file)
            .then(function (fileRecord) {
                $scope.readmeEditorTab.file = fileRecord;
                $scope.readmeEditorActive = true;
            });
    }

    $scope.closeReadmeEditor = function () {
        if ($scope.readmeDirty) {
            var project = $scope.readmeEditorTab.file.$project;
            ProjectManager.saveProjectReadme(project)
                .then(function (result) {
                    $scope.readmeDirty = false;
                    $scope.readmeState = "Close"
                    return ProjectManager.getProject(project)
                        .then(function (projectRecord) {
                            return ProjectData.getProjectREADME(project)
                                .then(function (readmedata) {
                                    projectRecord['$readme'] = readmedata;
                                });
                        });

                })
                .finally(function () {
                    $scope.readmeEditorActive = false;
                });
        }
        else {
            $scope.readmeEditorActive = false;
        }

    }

    $scope.isReadmeDirty = function isReadmeDirty () {
        return $scope.readmeDirty;
    }

    $scope.isReadmeEditorActive = function isReadmeEditorActive () {
        return $scope.readmeEditorActive;
    }

    $scope.onReadmeEditorLoaded = function onReadmeEditorLoaded (_editor) {
        var _session = _editor.getSession();
        _editor.setFontSize("14px");
        _session.setUseWorker(false);

        $scope.readmeEditorTab.editor = _editor;
    }

    $scope.onReadmeEditorChange = function onTextEditorChange (e) {
        var editor = e[1];
        var editorTabId = editor.renderer.container.id;
        $scope.readmeDirty = true;
        $scope.readmeEditorTab.file.dirty = true;
        $scope.readmeState = "Save"
    }

    $scope.onTextEditorLoaded = function onTextEditorLoaded (_editor) {
        var _session = _editor.getSession();
        _editor.setFontSize("14px");
        _session.setUseWorker(false);

        var editorTabId = _editor.renderer.container.id;

        if (!$scope.editorTabs[editorTabId].editor) {
            $scope.editorTabs[editorTabId].editor = _editor;
            $scope.editorTabs[editorTabId].active = true;

			$scope.editorTabs[editorTabId].editor.on("guttermousedown", function(e){
			    var target = e.domEvent.target;
			    var row = e.getDocumentPosition().row

			    if (target.className.indexOf("ace_gutter-cell") == -1)
			        return;
			    if (!e.editor.isFocused())
			        return;
			    if (e.clientX > 25 + target.getBoundingClientRect().left)
			        return;
			    if (e.editor.session.getBreakpoints()[row] == "ace_breakpoint") {
			    	e.editor.session.clearBreakpoint(row);
					var clone = e.editor.session.getBreakpoints().slice(0);
			    	return;
			    };

			    e.editor.session.setBreakpoint(row)
				var clone = e.editor.session.getBreakpoints().slice(0);
			    e.stop()
			})
        }
    };

    $scope.onTextEditorChange = function onTextEditorChange (e) {
        var editor = e[1];
        var editorTabId = editor.renderer.container.id;
        var editorTab = $scope.editorTabs[editorTabId];

        if (editorTab) {
            editorTab.file.textdata = editorTab.content;
            editorTab.file.dirty = true;
            ProjectManager.projects[editorTab.file.$project.full_name].dirty = true;
        }
    }

    $scope.onBlocklyEditorLoaded = function onBlocklyEditorLoaded (blocklyElement) {
        var editorTabId = blocklyElement.id;
        var editorTab = $scope.editorTabs[editorTabId];

        if (editorTab) {
            editorTab.blocklyFrameElement = blocklyElement.querySelector('iframe');
            editorTab.active = true;
        }
    }

    $scope.onBlocklyEditorChange = function onBlocklyEditorChange (xml, blocklyElement) {
        var editorTabId = blocklyElement.id;
        var editorTab = $scope.editorTabs[editorTabId];

        if (editorTab) {
            if (editorTab.file.textdata != editorTab.content) {
                editorTab.file.textdata = editorTab.content;
                editorTab.file.dirty = true;
                ProjectManager.projects[editorTab.file.$project.full_name].dirty = true;
            }
        }
    }

    $scope.onEditorTabActive = function onTextEditorActive (editorTabId) {
        $scope.currentTab = $scope.editorTabs[editorTabId];
        if ($scope.currentTab && $scope.currentTab.editor) {
            $scope.currentTab.editor.focus();
        }
    };

    var getFileContentType = function getFileContentType (extension) {
        if (extensionMap[extension]) {
            return extensionMap[extension];
        }
        else {
            return "unknown";
        }
    }

    $scope.$on('editor.closeBlockly', function (event, args) {
        angular.forEach($scope.editorTabs, function (i, proj) {
            if($scope.editorTabs[proj].contenttype == 'blockly') {
                var pathname = $scope.editorTabs[proj].pathname;
                delete $scope.editorTabs[proj];
                delete $scope.fileTabs[pathname];
            }
        });
    })

    $scope.$on('editor.clearAll', function (event, args) {
        angular.forEach($scope.editorTabs, function (i, proj) {
            var pathname = $scope.editorTabs[proj].pathname;
            delete $scope.editorTabs[proj];
            delete $scope.fileTabs[pathname];
        });
        $scope.editorTabs = {};
        $scope.fileTabs = {};
        $scope.currentTab = null;
    })

    $scope.$on('editor.closeTab', function (event, args) {
        angular.forEach($scope.editorTabs, function (i, proj) {
            if($scope.editorTabs[proj].name == args.name) {
                var pathname = $scope.editorTabs[proj].pathname;
                delete $scope.editorTabs[proj];
                delete $scope.fileTabs[pathname];
            }
        });
    })

    function clearEventHandler (event, args) {
        var projectRecord = $scope.currentProject;
        var executableFile = projectRecord.$manifest && projectRecord.$manifest.data && projectRecord.$manifest.data.executable;
        clearMarkers(executableFile);
    }

    $scope.$on('robot.executing', clearEventHandler);
    $scope.$on('robot.unloaded', clearEventHandler);
    $scope.$on('robot.resetting', clearEventHandler);
    $scope.$on('robot.halting', clearEventHandler);
    $scope.$on('robot.disconnecting', clearEventHandler);

    $scope.$on('robot.halted', function (event, args) {
        // console.log("halted: args = " + JSON.stringify(args, null, 4));
        if (args) {
            var projectRecord = $scope.currentProject;
            var executableFile = projectRecord.$manifest && projectRecord.$manifest.data && projectRecord.$manifest.data.executable;
            highlightEditorCurrentLine(executableFile, args.line);
        }
    })

    $scope.$on('robot.stepped', function (event, args) {
        // console.log("stepped: args = " + JSON.stringify(args, null, 4));
        if (args) {
            var projectRecord = $scope.currentProject;
            var executableFile = projectRecord.$manifest && projectRecord.$manifest.data && projectRecord.$manifest.data.executable;
            highlightEditorCurrentLine(executableFile, args.line);
        }
    })

    function highlightEditorCurrentLine (fileName, lineNumber) {
        var projectName = $scope.currentProject.$project.full_name;
        var fullName = projectName + '/' + fileName;
        var editorTab = $scope.fileTabs[fullName];

        if (editorTab.contenttype == "blockly") {
            var blocklyFrame = editorTab.blocklyFrameElement;
            blocklyFrame.contentWindow.postMessage({method: 'setBlocklyHighlight', arg: lineNumber}, '*');
        }
        else if (editorTab.contenttype == "text") {
            var editor = editorTab.editor;

            editor.gotoLine(lineNumber, 10, true);
            editorTab.markers[lineNumber] = editor.session.addMarker(new Range(lineNumber-1, 0, lineNumber-1, 200), "highlight_executingLine", "fullLine");
        }
    }

    function clearMarkers(fileName) {
        var projectName = $scope.currentProject.$project.full_name;
        var fullName = projectName + '/' + fileName;
        var editorTab = $scope.fileTabs[fullName];

        if (editorTab.contenttype == "blockly") {
            var blocklyFrame = editorTab.blocklyFrameElement;
            blocklyFrame.contentWindow.postMessage({method: 'clearBlocklyHighlight', arg: null}, '*');
        }
        else if (editorTab.contenttype == "text") {
            var editor = editorTab.editor;

            angular.forEach(editorTab.markers, function (markerId, lineNumber) {
                if (markerId) {
                    editor.session.removeMarker(markerId);
                    delete editorTab.markers[lineNumber];
                }
            });
        }
    }

    $scope.$on('editor.highlight', function (event, args) {
		var fullName = args.path + '/' + args.name;

		if (!$scope.fileTabs[fullName]) {
			//change this to new function when jon commits his updates
            $scope.openProjectFile(args.name, fullName);
		};

		if ($scope.fileTabs[fullName]) {
			$scope.editorTabs[$scope.fileTabs[fullName].tabId].active = true;
            $scope.currentTab = $scope.editorTabs[$scope.fileTabs[fullName].tabId];

    		$scope.editorTabs[$scope.fileTabs[fullName].tabId].editor.gotoLine(args.lineNumber, 10, true);

            if (args.msg !== null) {
                $scope.editorTabs[$scope.fileTabs[fullName].tabId].editor.session.setAnnotations([{row: args.lineNumber - 1, text: args.msg, type: "error"}]);
                $scope.editorTabs[$scope.fileTabs[fullName].tabId].editor.session.addMarker(new Range(args.lineNumber-1,0,args.lineNumber-1,200),"highlight_error","fullLine");
                return;
            };

            $scope.editorTabs[$scope.fileTabs[fullName].tabId].editor.session.addMarker(new Range(args.lineNumber-1,0,args.lineNumber-1,200),"highlight_executingLine","fullLine");
    	};
    });

    $scope.$on('editor.open', function (event, args) {
        $scope.createEditorFromProjectFile(args.projectFile);
    });

    $scope.createEditorFromProjectFile = function createEditorFromProjectFile (projectFile) {
        var path = projectFile.$project.full_name;
        var name = projectFile.$file.path;
        var content = projectFile.textdata;
        var contenttype = getFileContentType(extractFilenameExtension(name));

        $scope.createEditor(name, path, content, contenttype, projectFile);
    }

    $scope.createEditor = function createEditor (name, path, content, contenttype, projectFile) {
        var pathname = path + '/' + name;

        if (!$scope.fileTabs[pathname]) {
            var newEditorSessionId = 'editor-session-' + nextSessionIndex;

            var newEditorTab = {
                'name': name,
                'path': path,
                'contenttype': contenttype,
                'content': content,
                'tabId': newEditorSessionId,
                'file' : projectFile,
                'pathname': pathname,
                'markers': {}
            };

            $scope.editorTabs[newEditorSessionId] = newEditorTab;
            nextSessionIndex++;
            $scope.fileTabs[pathname] = newEditorTab;
        }
        else {
            $scope.editorTabs[$scope.fileTabs[pathname].tabId].active = true;
        }

    }

    $scope.createTextEditor = function createTextEditor (name, path, content) {
        $scope.createEditor(name, path, content, 'text');
    };

    $scope.createBlocklyEditor = function createTextEditor (name, path, content) {
        $scope.createEditor(name, path, content, 'blockly');
    };

    $scope.destroyEditor = function destroyTextEditor (editorid) {
        var editorToBeDeleted = $scope.editorTabs[editorid];
        var path = editorToBeDeleted.path;
        var name = editorToBeDeleted.name;
        var pathname = path + '/' + name;

        delete $scope.editorTabs[editorid];
        delete $scope.fileTabs[pathname];
    }

    $scope.getEditorTemplate = function getEditorTemplate (contenttype) {
        if (contentTypeMap[contenttype]) {
            return contentTypeMap[contenttype];
        }
        else {
            return "partials/noeditor.html";
        }
    }

    $scope.$on('editor.undo', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            editor.undo();
        }
    });

    $scope.$on('editor.redo', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            editor.redo();
        }
    });

    $scope.$on('editor.cut', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            var selectedText = editor.getCopyText();
            writeToClipboard(selectedText);
            editor.session.remove(editor.getSelectionRange());
            editor.focus();
        }
    });

    $scope.$on('editor.copy', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            var selectedText = editor.getCopyText();
            writeToClipboard(selectedText);
            editor.focus();
        }
    });

    $scope.$on('editor.paste', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            editor.focus();
            document.execCommand("paste", false, null);
        }
    });

    $scope.$on('editor.selectall', function () {
        if ($scope.currentTab && $scope.currentTab.editor) {
            var editor = $scope.currentTab.editor;
            editor.selectAll();
        }
    });

    $scope.isTabFromCommunityProject = function isTabFromCommunityProject (tabid) {
       var aTab = $scope.editorTabs[tabid];
       var tabProject = ProjectManager.projects[aTab.path];
       return (tabProject.projectType == "community");
    };

}]);