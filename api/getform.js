var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,callback){
    var id = core.request("id","int");
    if (!id){
        callback(404);
        return;
    }
    db.query("SELECT * FROM ext_forms WHERE id="+id,function(err,form){
        var fields;
        if (err){
            callback(err);
            return;
        }
        if (form && form.length){
            try{
                fields = JSON.parse(form[0].fields);
            }
            catch (e){
                callback(e);
                return;
            }
            models['admin'].getFieldsHTML(fields,"[{}]",function(err,field){
                callback(null,{fields:field,form:form[0]})
            });
        }
        else {
            callback(404);
        }
    });
};