// projectdata.js

var jadeIde = angular.module('jade-ide');
const samplesOrg = 'jadeapplications';

jadeIde.factory('SampleRepos', ['$resource', function sampleReposFactory($resource) {

    return $resource('https://api.github.com/orgs/:org/repos', {org: samplesOrg},
        {   'get':    {method:'GET', url: 'https://api.github.com/repos/:owner/:repo'},
            'query':  {method:'GET', params: {"per_page": 100}, isArray:true},
            'remove': {method:'DELETE'},
            'delete': {method:'DELETE'}
        }
    );

}]);

jadeIde.factory('UserRepos', ['$resource', function($resource) {
    return $resource('https://api.github.com/user/repos', {},
        {   'get':    {method:'GET', url: 'https://api.github.com/repos/:org/:name'},
            'query':  {method:'GET', params: {"per_page": 100}, isArray:true},
            'remove': {method:'DELETE'},
            'delete': {method:'DELETE'}
        }
    );
}]);

jadeIde.factory('RepoFiles', ['$resource', function($resource) {

    return $resource('https://api.github.com/repos/:owner/:repo/contents/:path', { path: '@path' },
        {   'get':    {method:'GET' },
            'save':   {method:'PUT'},
            'query':  {method:'GET', params: {"per_page": 100}, isArray:true},
            'remove': {method:'DELETE'},
            'delete': {method:'DELETE'}
        }
    );

}]);

jadeIde.factory('ProjectData', ['SampleRepos', 'UserRepos', 'RepoFiles', '$http', function projectDataFactory (SampleRepos, UserRepos, RepoFiles, $http) {

    return {
        getSampleProjects: function getSampleProjects(success, error) {
            // this function returns an array of project resource records
            return SampleRepos.query(null, success, error);
        },
        createProject: function createProject (name, description) {
            return $http({method: 'POST', url: 'https://api.github.com/user/repos', data: {"name": name, "description": description} });
        },
        cloneProject: function cloneProject(project) {
            return $http({method:'POST', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/forks'});
        },
        getUserProjects: function getUserProjects(success, error) {
            // this function returns an array of project resource records
            return UserRepos.query({'timestamp': new Date().getTime()}, success, error);
        },
        getProjectREADME: function getProjectREADME(project) {
            // this function returns a promise to return the README content
            return $http({method:'GET', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/readme', headers: {'Accept': 'application/vnd.github.v3.html'}, params: {'timestamp': new Date().getTime()} });
        },
        getProjectManifest: function getProjectManifest(project) {
            // this function returns a promise to return the project.json content
            return $http({method:'GET', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/contents/project.json', headers: {'Accept': 'application/vnd.github.v3.raw'} });
        },
        getProjectFiles: function getProjectFiles(project, success, error) {
            // this function returns an array of file resource records
            return RepoFiles.query({'owner': project.owner.login, 'repo': project.name, 'timestamp': new Date().getTime()}, success, error);
        },
        createProjectFile: function createProjectFile(project, newFilename, initialcontent, success, error) {
            return $http({method: 'PUT', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/contents/' + newFilename, data: {"message": "Initial file commit", "content": btoa(initialcontent)} });
        },
        saveProjectFile: function saveProjectFile(project, file, content, success, error) {
            return $http({method: 'PUT', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/contents/' + file.path, data: {"message": "Update to project file data", "content": btoa(content), "sha": file.sha } });
        },
        getProjectFileContent: function getProjectFileContent(project, file) {
            // this function returns a promise to return the file contents
            return $http({method:'GET', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/contents/' + file.path, headers: {'Accept': 'application/vnd.github.v3.raw'}, responseType: 'arraybuffer', params: {'timestamp': new Date().getTime() } });
        },
        delProjectFile: function delProjectFile(project, file) {
            return $http({method: 'DELETE', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name + '/contents/' + file.path, data: {"message": "Removing file from project", "sha": file.sha } });
        },
        delProject: function delProject(project) {
            return $http({method: 'DELETE', url: 'https://api.github.com/repos/' + project.owner.login + '/' + project.name });
        }
    };

}]);