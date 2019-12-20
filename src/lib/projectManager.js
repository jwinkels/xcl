"use strict";
exports.__esModule = true;
//Imports
var yaml = require("yaml");
var fs = require("fs-extra");
var os = require("os");
var Project_1 = require("./Project");
//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
var ProjectManager = /** @class */ (function () {
    function ProjectManager() {
        console.log("Baue Project Manager!!");
        ProjectManager.projectsYaml = yaml.parseDocument(fs.readFileSync(ProjectManager.xclHome + "/projects.yml").toString());
    }
    /**
     * returns the Instance of ProjectManager
     * @param project
     */
    ProjectManager.getInstance = function (project) {
        if (!ProjectManager.manager) {
            ProjectManager.manager = new ProjectManager();
        }
        var json = ProjectManager.projectsYaml.toJSON();
        if (json.projects[project]) {
            var projectJSON = json.projects[project];
            ProjectManager.project = new Project_1.Project(project, projectJSON.path);
            return ProjectManager.manager;
        }
        else {
            throw new Error("Cannot read Project '" + project + "' ");
        }
    };
    ProjectManager.prototype.getProjectHome = function () {
        return ProjectManager.project.getPath();
    };
    ProjectManager.prototype.createDirectoryPath = function (path, fullPath) {
        if (path instanceof Array) {
            for (var i = 0; i < path.length; i++) {
                this.createDirectoryPath(path[i], fullPath);
            }
        }
        else if (path instanceof Object) {
            for (var i = 0; i < Object.keys(path).length; i++) {
                var objName = Object.keys(path)[i];
                this.createDirectoryPath(path[objName], fullPath + objName + '/');
            }
        }
        else {
            if (!fs.existsSync(ProjectManager.project.getPath() + fullPath + path)) {
                fullPath = ProjectManager.project.getPath() + fullPath + path;
                fs.mkdirSync(fullPath, { recursive: true });
            }
        }
    };
    ProjectManager.prototype.createDirectoryStructure = function () {
        var dirsJson;
        var directories = [];
        var parsedDirs = yaml.parseDocument(fs.readFileSync("./config/directories.yml").toString());
        dirsJson = parsedDirs.toJSON();
        this.createDirectoryPath(dirsJson, "/");
    };
    ProjectManager.prototype.loadProjectConfiguration = function () {
        var config = yaml.parse(fs.readFileSync(ProjectManager.project.getPath() + '/xcl.yml').toString());
        //console.log(config);
    };
    ProjectManager.xclHome = os.homedir + '/AppData/Roaming/xcl';
    return ProjectManager;
}());
//ProjectManager.getInstance("xxx").loadProjectConfiguration();
//console.log(ProjectManager.getInstance("pvslite").getProjectHome());
ProjectManager.getInstance("xxx").createDirectoryStructure();
//console.log(ProjectManager.getInstance("test").getProjectHome());
