var db = require("../lib/db");
module.exports = function(core,options,callback){

    if (options.config && options.config.slider_id){

        db.query("(SELECT * FROM ext_slider WHERE id="+options.config.slider_id+" OR slider_id="+options.config.slider_id+" ORDER BY id) ORDER BY sort",function(err,slides){
            core.assign("slides",slides.splice(1));
            core.assign("slider",slides.splice(0));
            callback(err);
        });
    }
    else {
        callback();
    }
};