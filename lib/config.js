var path = require("path");
var fs = require("fs");
var bootstrap = require("../lib/bootstrap");
bootstrap.addModule("config");
var sitename = path.dirname(__dirname, "/lib");
var  project = path.basename(sitename);
var extend = require("util")._extend;
var config = {};



function update(obj){
    var cfg = {};
    if (typeof obj == "object"){
        Object.keys(config).forEach(function(item){
            if (obj[item] && obj[item] != config[item]){
                if (obj[item] == "true" || obj[item] == "false"){
                    obj[item] = JSON.parse(obj[item]);
                }
                delete config[item];
                config[item] = obj[item]
            }
        });
        delete config['websitePath'];
        delete config['project'];
        fs.writeFileSync(sitename+"/config.json",JSON.stringify(config),"utf-8");
        config['websitePath'] = sitename;
        config['project'] = project;
    }
    else {
        try{
            cfg = JSON.parse(fs.readFileSync(sitename+"/config.json","utf-8"));
            extend(config,cfg);
            config['websitePath'] = sitename;
            config['project'] = project;
        }
        catch (err){
            console.log(err);
        }
    }
}
update();
exports.config = config;
exports.update = update;

