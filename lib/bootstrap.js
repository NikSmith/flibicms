var redis = require("redis");
var modules = {};
var sub = redis.createClient();
var pub = redis.createClient();

exports.addModule = function(name){
    if (!modules[name]){
        modules[name] = require("../lib/"+name);
    }
};
function bootstrap(name,cb){
    if (name){
        modules[name].update(cb);
    }
    else {
        for (var _module in modules){
            if (modules.hasOwnProperty(_module) && modules[_module].update){
                modules[_module].update();
            }
        }
    }
}


exports.bootstrap = bootstrap;
exports.update = function(name){
    pub.publish("bootstrap", JSON.stringify({cmd:"update",name:name}));
};

sub.on("message", function (channel, msg) {
    var data;
    try{
        data = JSON.parse(msg);
    }
    catch (e){
        data = {};
    }
    if ("update" == data.cmd){
        bootstrap(data.name);
    }
});
sub.subscribe("bootstrap");