var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,callback){
    var obj = {
        subject: core.request("subject","str"),
        group: core.request("group","int"),
        message: core.request("message","str")
    };

    if (!obj.subject || !obj.group || !obj.message){
        callback(404);
        return;
    }

    var mailer = models['mailer'].createMailer();
    db.query("SELECT * FROM users WHERE usergroup="+obj.group,function(err,users){
        if (err){
            callback(err);
            return;
        }
        users.forEach(function(user){
            mailer.send({
                to: user.email,
                subject:obj.subject,
                html:obj.message
            });
        });
        var html = "Количество отправленных сообщений: "+users.length;
        callback(null,{html: html});
    });
};