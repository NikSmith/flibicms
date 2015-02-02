var models = require("../lib/model");
module.exports = {
    login: function (core) {
        this.run = function (callback) {
            if (core.userGroup != 'guest'){
                callback(404);
                return;
            }
            var schema = {
                login: core.request("login","str"),
                pass: core.request("pass","str")
            };
            if (schema.login && schema.pass){
                 models['users'].auth(schema,function(err,user){
                     if (err){
                         callback(err);
                         return;
                     }
                     if (user){
                         core.setSession("usergroup",user.usergroup);
                         core.setSession("userlogin",user.login);
                         core.setSession("userid",user.id);
                         var refer = core.getSession("refer");
                         if (refer){
                             core.delSession("refer");
                             callback(301,refer);
                         }
                         else {
                             callback(301,"/");
                         }
                     }
                     else {
                         callback(302,"/users/login");
                     }
                 });
            }
            else {
                core.setTitle("Авторизация");
                callback();
            }
        }
    },
    logout: function(core){
        this.run = function(callback){
            core.delSession("usergroup");
            core.delSession("userlogin");
            core.delSession("userid");
            core.delSession("refer");
            callback(301,"/");
        }
    }
};