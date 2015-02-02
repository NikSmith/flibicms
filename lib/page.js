var page = function (data,all) {
    if (all){
        this.layout = "layouts/index";
        this.header = [];
        this.title = "";
        this.meta = {
            desc:"",
            keywords:""
        };
    }
    this.template = data.controller+"/"+data.action;
    this.vars = {};
    this.controller = data.controller;
    this.action = data.action;
    this.render = false;

    this.userGroup = data.usergroup;

};
module.exports = page;