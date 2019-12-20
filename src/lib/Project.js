"use strict";
exports.__esModule = true;
var Project = /** @class */ (function () {
    function Project(name, path) {
        this.name = name;
        this.path = path;
    }
    Project.prototype.getPath = function () {
        return this.path + "/" + this.name;
    };
    Project.prototype.getName = function () {
        return this.name;
    };
    return Project;
}());
exports.Project = Project;
