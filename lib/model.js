var config = require("./config").config;
var fs = require("fs");
var models = {};

function getModels(){
    models = {};
    fs.readdir(config.websitePath+"/models", function (err, data) {
        var name;
        if (data.length) {
            for (var i=0; i<data.length; i++){
                name = data[i].indexOf(".") != -1 ? data[i].substr(0, data[i].indexOf(".")) : data[i];
                models[name] = require("../models/" + data[i]);
            }
        }
    });
}
getModels();
module.exports = models;