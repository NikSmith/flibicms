var fs = require("fs");
var db = require("../lib/db");

var ext = {};
var config= require("../lib/config").config;

function update(){
    db.query("SELECT target FROM extension", function (err, data) {
        if (!err) {
            data.forEach(function (item) {
                fs.exists(config.websitePath+"/extension/"+item.target+".js",function(exists){
                    if (exists) {
                        ext[item.target] = require("../extension/"+item.target+".js");
                    }

                });
            });

        }
    });
};
update();
exports.extensions = ext;


