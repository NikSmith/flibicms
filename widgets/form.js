var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,options,callback){
    if (options.config && options.config.formid){
        db.query("SELECT * FROM ext_forms WHERE id="+options.config.formid,function(err,form){
            var fields;
            if (!err){
                if (!form || !form.length){
                    callback();
                    return;
                }
                try{
                    fields = JSON.parse(form[0].fields);
                }
                catch (e){
                    callback();
                    return;
                }
                models['admin'].getFieldsHTML(fields,"[{}]",function(err,html){
                    if (err){
                        callback(err);
                        return;
                    }
                    core.assign("form",form[0]);
                    core.assign("fields",html);
                    callback(err);
                });
            }
            else {
                callback(err);
            }
        });
    }
    else {
        callback();
    }
};