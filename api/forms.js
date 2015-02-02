var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,callback){
    var formid = core.request("formid","int");
    if (!formid){
        callback(404);
        return;
    }
    db.query("SELECT * FROM ext_forms WHERE id="+formid,function(err,form){
        var html = '';
        if (err){
            callback(err);
            return;
        }
        if (!form || !form.length){
            callback(404);
            return;
        }

        var fields;
        var errors = [];
        try{
            fields = JSON.parse(form[0].fields);
        }
        catch (e){
            callback(e);
            return;
        }
        var multiple;
        for (var i=0; i<fields.length;i++){

            if (fields[i].tag != "submit" && fields[i].tag != "html"){
                if (fields[i].required == true && !core.req.body[fields[i].name]){
                    errors.push(fields[i].name);
                }
                html+="<strong>"+fields[i].desc+": </strong>";

                if ((fields[i].tag == "input" && fields[i].type == "text") || fields[i].tag == "textarea"){
                    html+=core.req.body[fields[i].name];
                }
                else {
                    for (var x=0; x<fields[i].data.length;x++){
                        if (fields[i].type == "checkbox"){
                            if (core.req.body[fields[i].data[x].name]){
                                html+=fields[i].data[x].title+" ";
                            }
                        }
                        if (fields[i].type == "radio") {
                            if (core.req.body[fields[i].name] == fields[i].data[x].value) {
                                html += fields[i].data[x].title + " ";
                            }
                        }

                        if (fields[i].tag == "select"){
                            if (fields[i].type == "multiple"){
                                if (typeof core.req.body[fields[i].name] == "object" && core.req.body[fields[i].name].length){
                                    if (core.req.body[fields[i].name].indexOf(fields[i].data[x].value) != -1){
                                        html+=fields[i].data[x].title+" ";
                                    }
                                }
                                else {
                                    if (core.req.body[fields[i].name] == fields[i].data[x].value){
                                        html+=fields[i].data[x].title+" ";
                                    }
                                }
                            }
                            else {
                                if (core.req.body[fields[i].name] == fields[i].data[x].value){
                                    html+=fields[i].data[x].title+" ";
                                }
                            }
                        }
                    }
                }
                html+="<br>";
            }
        }

        if (errors.length){
            callback(null,errors)
            return;
        }

        var mailer = models['mailer'].createMailer();
        mailer.send({
            to: form[0].email,
            subject:"Сообщение с сайта",
            html:html
        });


        callback(null,errors);
    });
};