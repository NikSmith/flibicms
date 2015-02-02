var config = require("../lib/config").config;
var msql = require('mysql-libmysqlclient');
var conn, result, row, rows;
var
    host = config.dbhost,
    user = config.dbuser,
    password = config.dbpass,
    database = config.dbname;

conn = msql.createConnectionSync();
var connected = conn.connectSync(host, user, password, database);


if (!connected){
    console.log("NO CONNECT DB");
    exports.prePage = exports.query = exports.escape = exports.insert = exports.update = function(){};
}
else {
    conn.query("SET NAMES utf8");
    exports.prePage = prePage;
    exports.query = query;
    exports.escape = escape;
    exports.insert = insert;
    exports.update = update;
}


/*var connection = mysql.createConnection({
    host: config.dbhost,
    database: config.dbname,
    user: config.dbuser,
    password: config.dbpass
});*/



/*  Постраничный запрос данных в БД, где
        obj.page - номер запрашиваемой страницы
        obj.table - таблица в БД
        obj.fields - запрашиваемые поля
        obj.order - сортировка (часть строки запроса)
        obj.condition - условие выборки (часть строки запроса)
        obj.limit - количество извлекаемых строк, по умолчанию 30
*/
function prePage(obj,callback){
    var data = {
        start : 0,
        pages: 0,
        page:obj.page,
        total: 0,
        child:[]
    };
    // Проверка переданного объекта
    var error = false;
    if (!obj.table || !obj.fields){
        error = true;
    }
    if (!data.page){
        data.page = 1;
    }
    if (!obj.limit){
        obj['limit'] = 30;
    }

    if (error){
        callback(error, obj);
        return;
    }

    conn.query("SELECT count(*) as count FROM "+obj.table+" WHERE "+obj.condition, function (err, res) {
        if (!err){
            res.fetchAll(function (err, count) {
                if (!err){
                    if (count.length){
                        data.total = count[0].count;
                        data.pages = Math.ceil(data.total/obj.limit);
                        data.start = ((obj.page-1)*obj.limit);

                        if (data.start >= data.total && data.total!=0){
                            callback(404,data);
                        }
                        else {
                            conn.query("SELECT "+obj.fields+" FROM "+obj.table+" WHERE "+obj.condition+" ORDER BY "+obj.order+" LIMIT "+data.start+","+obj.limit, function (err, res) {
                                if (!err){
                                    data.child = res.fetchAllSync();
                                    callback(null,data);
                                    /*res.fetchAll(function (err, rows) {
                                        if (!err){
                                            data.child = rows.splice(0);
                                            callback(null,data);
                                        }
                                        else {
                                            callback(err);
                                        }
                                    });*/
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                    }
                    else {
                        callback(null,data);
                    }
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(err);
        }
    });
}
//SHOW COLUMNS FROM
function insert(table,params,callback){
    var query = "SHOW FIELDS FROM "+table;
    conn.query(query,function(err,resource){
        if (!err){
            resource.fetchAll(function (err, res) {
                var fields = [];
                var string = '';
                for (var item in res){
                    fields.push(res[item].Field);
                    if (res[item].Extra == 'auto_increment'){
                        string+='null,';
                    }
                    else {
                        if (params[res[item].Field]){
                            string+="'"+params[res[item].Field]+"',";
                        }
                        else {
                            string+='"",';
                        }
                    }
                }
                query = "INSERT INTO "+table+" VALUE ("+string.substr(0,string.length-1)+")";
                conn.query(query,function(err,result){
                    callback(err,result);
                });
            });
        }
        else {
            callback(err,null);
        }
    });
}
function update(table,params,where,callback){
    var query = "SHOW FIELDS FROM "+table;
    conn.query(query, function (err, resource) {
        if (!err){
            resource.fetchAll(function (err, res) {
                var fields = [];
                for (var item in res){
                    fields.push(res[item].Field);
                }
                var string = '';
                for (var param in params){
                    if (params.hasOwnProperty(param)){
                        if (fields.indexOf(param) != -1){
                            string += "`"+param+"`='"+params[param]+"',";
                        }
                    }
                }
                string = string.substr(0,string.length-1);
                if (string.length){
                    if (where){
                        string+=" WHERE "+where;
                    }
                    query = "UPDATE "+table+" SET "+string;
                    conn.query(query, function (err, res) {
                        callback(err,res);
                    });
                }
                else {
                    callback('Not found params',null);
                }
            });
        }
        else {
            callback(err);
        }
    });
}
function query(query, callback) {
    conn.query(query, function (err, res) {
        if (!err){
            if (res.fieldCount || res.fieldCount == 0){
                callback(null,res.fetchAllSync());
            }
            else {
                callback(err,res)
            }
            /*res.fetchAll(function (err, rows) {
                callback(null,rows);
            });*/
        }
        else {
            callback(err);
        }
    });
}
function escape(s) {
    return "'"+conn.escapeSync(s)+"'";
}

