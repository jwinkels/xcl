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
    ProjectManager.prototype.loadProjectConfiguration = function () {
        var config = yaml.parse(fs.readFileSync(ProjectManager.project.getPath() + '/xli.yml').toString());
        console.log(config);
    };
    ProjectManager.xclHome = os.homedir + '/AppData/Roaming/xcl';
    return ProjectManager;
}());
ProjectManager.getInstance("xxx").loadProjectConfiguration();
console.log(ProjectManager.getInstance("pvslite").getProjectHome());
//console.log(ProjectManager.getInstance("test").getProjectHome());
