var upload = require("../models/upload");
module.exports = function(core,callback){
    upload.uploadFile({},core.req,function(err,files){
        callback(err,{files:files});
    });
};