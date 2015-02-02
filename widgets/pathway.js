module.exports = function(core,options,callback){
    var pathway = {
        pages: [],
        link:''
    };
    pathway['pages'] = core.getSession("pathwayPages");
    pathway['prelink'] = core.getSession("pathwayPrelink");
    core.assign("pathway",pathway);
    core.delSession("pathwayPages");
    core.delSession("pathwayPrelink");
    callback(null);
};