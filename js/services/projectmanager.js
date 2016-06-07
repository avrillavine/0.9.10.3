// projectmanager.js

jadeIde.factory('ProjectManager', ['$q', 'Builder', 'ProjectData', 'Robot', 'LogService', function($q, Builder, ProjectData, Robot, LogService) {
    var projects = {};
    var userProjects = {};
    var sampleProjects = {};

    var extensionMap = Builder.getExtensionMap();
    var reverseExtensionMap = Builder.getReverseExtensionMap();

    function projectToRobotFilename(projectFilename) {
        var filenameParts = projectFilename.split('.');
        var basename = filenameParts[0];
        var extname = filenameParts[1];
        if (extensionMap[extname]) {
            return basename + '.' + extensionMap[extname].outputExtension;
        }
        else {
            return null;
        }
    }

    function robotToProjectFilenames(robotFilename) {
        var filenameParts = robotFilename.split('.');
        var basename = filenameParts[0];
        var extname = filenameParts[1];
        var projectFilenames = [];
        angular.forEach(reverseExtensionMap[extname], function (ext, idx) {
            projectFilenames.push(basename + '.' + ext.inputExtension);
        }, projectFilenames);
        return projectFilenames;
    }

    function loadProjectData () {
        return loadUserProjects()
            .then(loadSampleProjects);
    }

    function clearUserProjects () {
        angular.forEach(userProjects, function (i, proj) {
            delete userProjects[proj];
        });

        angular.forEach(sampleProjects, function (i, proj) {
            delete sampleProjects[proj];
        });

        angular.forEach(projects, function (i, proj) {
            delete projects[proj];
        });

        return;
    }

    function deleteProjectFile (project, file) {
        return ProjectData.delProjectFile(project, file)
    }

    function deleteProj (project) {
        return ProjectData.delProject(project)
            .then(loadUserProjects);
    }

    function loadUserProjects () {
        return ProjectData.getUserProjects().$promise.then(function (userProjectsData) {

            var deferred = $q.defer();
            userProjects['$projects'] = userProjectsData;
            var projectPromises = [];
            angular.forEach(userProjectsData, function (project, idx) {
                projectPromises.push(
                    getProject(project)
                        .then(function (projectRecord) {
                            if (projectRecord.$manifest && projectRecord.$manifest.data && projectRecord.$manifest.data.executable) {
                                userProjects[projectRecord.$project.name] = projectRecord;
                                projectRecord.projectType = 'user';
                            }
                            return projectRecord;
                        })
                );
            });

            $q.all(projectPromises)
                .then(function (result) {
                    deferred.resolve(userProjects);
                })
                .catch(function (reason) {
                    deferred.reject(reason);
                });

            return deferred.promise;
        });
    }

    function loadSampleProjects () {
        return ProjectData.getSampleProjects().$promise.then(function (sampleProjectsData) {

            var deferred = $q.defer();
            sampleProjects['$projects'] = sampleProjectsData;
            var projectPromises = [];
            angular.forEach(sampleProjectsData, function (project, idx) {
                projectPromises.push(
                    getProject(project)
                        .then(function (projectRecord) {
                            if (projectRecord.$manifest && projectRecord.$manifest.data && projectRecord.$manifest.data.executable) {
                                sampleProjects[projectRecord.$project.name] = projectRecord;
                                projectRecord.projectType = 'community';
                            }
                            return projectRecord;
                        })
                );
            });

            $q.all(projectPromises)
                .then(function (result) {
                    deferred.resolve(sampleProjects);
                })
                .catch(function (reason) {
                    deferred.reject(reason);
                });

            return deferred.promise;
        });
    }

    function createProject(name, description, langtype) {
        return ProjectData.createProject(name, description)
            .then(function (result) {
                var projectResource = result.data
                userProjects['$projects'].push(projectResource);
                getProject(projectResource);
            });
    }

    function cloneProject(project) {
        return ProjectData.cloneProject(project.$project)
            .then(loadUserProjects);
    }

    function createFile(project, name, content) {
        console.log(name);
        return ProjectData.createProjectFile(project.$project, name, content)
            .then(function () {
                return getProject(project.$project);
            });
    }

    /*
        getProject(project)
        - params:
            project: the project resource instance
        - returns
            a populated project record
    */
	function getProject (project) {
		var deferred = $q.defer();

        if (!projects[project.full_name]) {
            projects[project.full_name] = { "$project": project };
        }

        var projectRecord = projects[project.full_name];

        ProjectData.getProjectFiles(project).$promise
            .then(function (files) {

                projectRecord['$files'] = files;
                projectRecord['$robotfiles'] = {};

                angular.forEach(files, function (file, idx) {
                    var filename = file.name;
                    if (!this[filename]) {
                        this[filename] = { '$project': project, '$file': file };
                    }
                    else {
                        this[filename].$file = file;
                    }
                    var fileRecord = this[filename];
                    var robotFilename = projectToRobotFilename(filename);

                    if (robotFilename) {
                        if (!this['$robotfiles'][projectToRobotFilename(filename)]) {
                            this['$robotfiles'][projectToRobotFilename(filename)] = fileRecord;
                        }
                    }
                }, projectRecord);

                ProjectData.getProjectManifest(project)
                    .then(function(manifest) {
                        projectRecord['$manifest'] = manifest;
                        deferred.resolve(projectRecord);
                    })
                    .catch(function (reason) {
                        deferred.resolve(projectRecord);
                    });
            })
            .catch(function (reason) {
                deferred.resolve(projectRecord);
            });

        return deferred.promise;
	}

    /*
        getProjectFile(project, file)
        - params:
            project: the project resource instance
            file: the file resource instance
        - returns
            a populated file record
    */
    function getProjectFile(project, file) {
        var deferred = $q.defer();
        if (project && file) {

            var fileRecord = projects[project.full_name][file.name];
            if (!fileRecord.content) {
                ProjectData.getProjectFileContent(project, file)
                    .then(
                        function (content) {
                            fileRecord.content = content;
                            fileRecord.textdata = convertArrayBufferToString(content.data);
                            deferred.resolve(fileRecord);
                        })
                    .catch(function (reason) {
                        deferred.reject(reason);
                    });
            }
            else {
            	deferred.resolve(fileRecord);
            }
        }
        else {
            deferred.reject("Couldn't open project: " + project + ", file: " + file);
        }
        return deferred.promise;
    }

    function createProjectExecutable(project, langtype, success, error) {
        langtype = langtype.toLowerCase();
        var langtypemap = {
            'c': {
                exec_extension: "script",
                initial_content: ""
            },
            'scratch': {
                exec_extension: "xml",
                initial_content: '<xml xmlns="http://www.w3.org/1999/xhtml"></xml>\n'
            }
        };

        var executableName = project.name + "." + langtypemap[langtype].exec_extension;
        return ProjectData.createProjectFile(project, executableName, langtypemap[langtype].initial_content);
    }

    function createProjectReadme(project, desc, langType, success, error) {
        var readmeContent = "" +
            project.name + "\n" +
            "================\n" +
            "\n" +
            desc + "\n" +
            "\n" +
            "### Project Information\n" +
            "```\n" +
            "Type              : " + langType + "\n" +
            "Version           : 1.0.0\n" +
            "Author            : " + project.owner.login + "\n" +
            "Firmware          : 42\n" +
            "```\n" +
            "\n" +
            "### Additional Information\n" +
            "This project requires a Jade Robot to run!\n" +
            "\n" +
            "### License\n" +
            "This software is provided \"as is\" without any expressed or implied warranties.  In no case shall the author or any contributors be liable for any damages caused by the use of this software.\n" +
            "\n";

        return ProjectData.createProjectFile(project, "README.md", readmeContent);
    }

    function createProjectManifest(project, langtype, success, error) {
        langtype = langtype.toLowerCase();
        var langtypemap = {
            'c': {
                exec_extension: "script"
            },
            'scratch': {
                exec_extension: "xml"
            }
        }

        var manifest = {
            "name": project.name,
            "version": "1.0.0",
            "manifest_version": 1,
            "project_type": "application",
            "executable_type": langtype,
            "executable": project.name + "." + langtypemap[langtype].exec_extension,
            "author": project.owner.login,
            "minimum_firmware_version": 42
        };
        var manifestJSON = JSON.stringify(manifest, undefined, 4);

        return ProjectData.createProjectFile(project, "project.json", manifestJSON);
    }

    /*
        saveProjectReadme(project)
        - params:
            project: the project resource instance
        - returns
            a populated file record
    */
    function saveProjectReadme(project) {
        var projectRecord = projects[project.full_name];
        var projectReadmeFileRecord = projectRecord['README.md'];
        return saveProjectFile(projectRecord, projectReadmeFileRecord, projectReadmeFileRecord.textdata);
    }

    function saveProjectFile(projectRecord, fileRecord, content, success, error) {
        var deferred = $q.defer();

        ProjectData.saveProjectFile(projectRecord.$project, fileRecord.$file, content, success, error)
           .then(function (result) {
                fileRecord.$file.sha = result.data.content.sha;
                fileRecord.$file.git_url = result.data.content.git_url;
                fileRecord.$file.size = result.data.content.size;
                fileRecord.dirty = false;
                deferred.resolve(fileRecord);
            })
            .catch(function (reason) {
                var statusCode = reason.status || "???";
                var statusText = reason.statusText || "Unknown error";
                var errorMessage = (reason.data && reason.data.message) || "No error message."
                var saveFailureReason = "Failed to save file to GitHub: \nStatus: " + statusCode + " " + statusText + "\n" + "Reason: " + errorMessage;
                return deferred.reject(saveFailureReason);
            });

        return deferred.promise;
    }

    function bufferProject(project) {
        var deferred = $q.defer();

        if (project) {
            var filePromises = [];
            angular.forEach(project.$robotfiles, function (file, idx) {
                filePromises.push(
                    getProjectFile(project.$project, file.$file)
                        .then(function (fileRecord) {
                            if (fileRecord.dirty) {
                                var updatedArrayBuffer = convertStringToArrayBuffer(fileRecord.textdata);
                                fileRecord.content.data = updatedArrayBuffer;
                                if (project.projectType == 'user') {
                                    return saveProjectFile(project, fileRecord, fileRecord.textdata)
                                }
                                else {
                                    fileRecord.dirty = false;
                                    return $q.when(fileRecord);
                                }
                            }
                            else {
                                return $q.when(fileRecord);
                            }
                        })
                );
            });

            $q.all(filePromises)
                .then(function (result) {
                    project.dirty = false;
                    deferred.resolve(project);
                })
                .catch(function (reason) {
                    deferred.reject("Error updating project:\n" + reason);
                });
        }
        else {
            deferred.reject("No project is selected");
        }


        return deferred.promise;
    }

    function buildProject(project) {
        var deferred = $q.defer();
        var filePromises = [];
        angular.forEach(project.$robotfiles, function (file, idx) {
            filePromises.push(
                getProjectFile(project.$project, file.$file)
                    .then(Builder.buildFile)
            );
        });

        $q.all(filePromises)
            .then(function (result) {
                LogService.buildLogMsg("Project build successful");
                deferred.resolve(project);
            })
            .catch(function (reason) {
                LogService.buildLogMsg("Project build failed");
                deferred.reject('Error building project file: ' + reason);
            });

        return deferred.promise;
    }

    function transferProject(project) {
        var deferred = $q.defer();

        var robotFiles = Object.keys(project.$robotfiles);
        var fileIndex = 0;

        var doTransfer = function doTransfer () {
            var robotFile = project.$robotfiles[robotFiles[fileIndex]];
            getProjectFile(project.$project, robotFile.$file)
                .then(Robot.getFileInfo)
                .then(Robot.transferFile)
                .then(function () {
                    fileIndex++;
                    if (fileIndex < robotFiles.length) {
                        doTransfer();
                    }
                    else {
                        LogService.buildLogMsg("Transfer to robot successful.");
                        deferred.resolve(project);
                    }
                })
                .catch(function (reason) {
                    LogService.buildLogMsg("Transfer to robot failed.");
                    deferred.reject('Error transferring project: \n' + reason)
                });
        }

        LogService.buildLogMsg("Transferring output files to robot...");
        doTransfer();

        return deferred.promise;
    }

    function checkRobot(project) {
        var deferred = $q.defer();

        if (Robot.info.isConnected) {
            LogService.buildLogMsg("Performing pre-transfer Robot checks...");
            Robot.halt()
                .then(Robot.getAvailableBytes)
                .then(function (availbytes) {
                    var availableBytes = parseInt(availbytes.slice(0,6).trim());
                    LogService.buildLogMsg("Space available on robot is: " + availableBytes);
                    if (availableBytes < 50000) {
                        LogService.buildLogMsg("Attempting garbage collection to reclaim space...");
                        var gcStartTime = new Date();
                        Robot.garbageCollect()
                            .then (function (result) {
                                var gcEndTime = new Date();
                                LogService.buildLogMsg("Garbage collection complete, took " + (gcEndTime.getTime() - gcStartTime.getTime()) + " ms");
                                LogService.buildLogMsg("Pre-transfer Robot checks complete.");
                                deferred.resolve(project);
                            })
                            .catch (function (reason) {
                                deferred.reject('Error performing garbage collection: \n' + reason);
                            });
                    }
                    else {
                        LogService.buildLogMsg("Pre-transfer Robot checks complete.");
                        deferred.resolve(project);
                    }
                })
                .catch(function (reason) {
                    deferred.reject('Error performing pre-transfer Robot checks: \n' + reason);
                });
        }
        else {
            deferred.reject("Build was successful, but the Jade Robot is not connected.\nConnect to the Jade Robot and retry the 'Transfer to Robot' operation.");
        }


        return deferred.promise;
    }

    function loadProject(project) {
        var deferred = $q.defer();
        var projectExecutable = project && project.$manifest && project.$manifest.data && project.$manifest.data.executable;
        var robotExecutable = projectToRobotFilename(projectExecutable);

        if (projectExecutable && robotExecutable) {
            LogService.buildLogMsg("Loading project executable on robot: " + robotExecutable);
            Robot.loadScript(robotExecutable)
                .then(function (result) {
                    LogService.buildLogMsg("Project executable loaded");
                    deferred.resolve(project);
                })
                .catch (function (reason) {
                    LogService.buildLogMsg("Project executable failed to load: " + reason);
                    deferred.reject('Error loading project executable on robot: \n' + reason);
                });
        }
        return deferred.promise;
    }

    function checkAndLoadProject(project) {
        var deferred = $q.defer();
        var projectExecutable = project && project.$manifest && project.$manifest.data && project.$manifest.data.executable;
        var robotExecutable = projectToRobotFilename(projectExecutable);

        if (projectExecutable && robotExecutable) {
            LogService.buildLogMsg("Checking to see if executable on robot: " + robotExecutable);
			Robot.getRobotStatus()
				.then(function (myRobotStatus) {
					var currentName = myRobotStatus.name + "s";
					if (robotExecutable !== currentName) {
			            Robot.loadScript(robotExecutable)
			                .then(function (result) {
			                    LogService.buildLogMsg("Project executable loaded & Ready to Execute");
			                    deferred.resolve(project);
			                })
			                .catch (function (reason) {
			                    LogService.buildLogMsg("Project executable failed to load: " + reason);
			                    deferred.reject('Error loading project executable on robot: \n' + reason);
			                });
					}
					else {
	                    LogService.buildLogMsg("Project Ready To Execute");
	                    deferred.resolve(project);
					}
                })
				.catch (function (reason) {
	                LogService.buildLogMsg("Project executable failed to Get Status: " + reason);
                    deferred.reject('Error Getting Status on robot: \n' + reason);
				});
        }
        return deferred.promise;
    }
	
    function resumeExecution(project) {
        var deferred = $q.defer();
        var projectExecutable = project && project.$manifest && project.$manifest.data && project.$manifest.data.executable;
        var robotExecutable = projectToRobotFilename(projectExecutable);

        if (projectExecutable && robotExecutable) {
            LogService.buildLogMsg("Starting Execution for: " + robotExecutable);
			Robot.resume()
				.then(function (myRobotResume) {
	                LogService.buildLogMsg("Project Executing");
	                deferred.resolve(project);
                })
				.catch (function (reason) {
	                LogService.buildLogMsg("Project executable failed to start Executing: " + reason);
                    deferred.reject('Error Executing on the Robot: \n' + reason);
				});
        }
        return deferred.promise;
    }
	
    return {
        'projects':                projects,
        'userProjects':            userProjects,
        'sampleProjects':          sampleProjects,
        'loadProjectData':         loadProjectData,
        'loadUserProjects':        loadUserProjects,
        'clearUserProjects':       clearUserProjects,
    	'getProject':              getProject,
        'getProjectFile':          getProjectFile,
        'createProject':           createProject,
        'cloneProject':            cloneProject,
        'createFile':              createFile,
        'bufferProject':           bufferProject,
        'buildProject':            buildProject,
        'checkRobot':              checkRobot,
        'transferProject':         transferProject,
        'loadProject':             loadProject,
		'checkAndLoadProject':     checkAndLoadProject,
		'resumeExecution':         resumeExecution,
        'saveProjectReadme':       saveProjectReadme,
        'createProjectManifest':   createProjectManifest,
        'createProjectReadme':     createProjectReadme,
        'createProjectExecutable': createProjectExecutable,
        'deleteProjectFile':       deleteProjectFile,
        'deleteProj':              deleteProj
    };

}]);
