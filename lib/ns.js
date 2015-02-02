var db = require("../lib/db");

var NestedSets = {
    /*
        Возвращает информацию о текущем узлом с номером id
        Возвращает параметры NSLeft, NSRight, NSLevel или Null
    */
    getNodeInfo:function(id,table, callback) {
        if (!table || !id){
            callback(null,null);
        }
        var query = "SELECT NSLeft, NSRight,NSLevel, TreeId FROM "+table+" WHERE id="+id;
        db.query(query,function(err,data){
            if (err || !data || !data.length){
                callback(err,null);
            }
            else {
                callback(null,data[0]);
            }
        });
    },

    // Возвращает данные о родителе элемента с номером ID
    getParentInfo: function(id,table,callback){
        NestedSets.getNodeInfo(id,table,function(err,node){
            var level =  0;
            var sql;
            if (!err){
                level = node.NSLevel - 1;
                sql = 'SELECT * FROM ' +table
                    + ' WHERE NSLeft < ' + node['NSLeft']
                    + ' AND NSRight >' + node['NSRight']
                    + ' AND NSLevel = ' + level
                    + ' AND TreeId = '+ node['TreeId']
                    + ' ORDER BY NSLeft';
                db.query(sql,function(err,res){
                    if (!err){
                        if (res.length){
                            callback(null,res[0]);
                        }
                        else {
                            callback(null,null);
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
    },

    /* Выводит всех родителей элемента с номером id.
        _fields – массив с перечислением требуемых вам полей таблицы ['field1', 'field2'...]
        condition – дополнительные условия для запроса  - НЕ РЕАЛИЗОВАНО
    */
    parents: function(id,_fields,table,condition,callback){
        var fields,sql;
        if (typeof _fields == "object"){
            fields = "A."+_fields.join(", A.");
        }
        else {
            fields = "A.*"
        }

        /*if (condition) {
            condition = PrepareCondition($condition, FALSE, 'A.');
        }*/

        sql = 'SELECT ' + fields + ', CASE WHEN A.NSLeft + 1 < A.NSRight THEN 1 ELSE 0 END AS nflag ' +
            'FROM ' + table + ' A, ' + table + ' B ' +
            'WHERE A.TreeId = B.TreeId AND B.id = ' + id + ' AND B.NSLeft BETWEEN A.NSLeft AND A.NSRight';
        sql+=condition;
        sql += ' ORDER BY A.NSLeft';
        db.query(sql,function(err,res){
            callback(err,res);
        });
    },

    /*
    Вставка элемента
        id: элемент родитель для вставляемого,
        table: Таблица,
        data:{} вставляемый элемент, объект содержит вставляемые данные
    */
    insertNode: function(id,table,data,callback){
        var query = "SELECT * FROM "+table+" WHERE id="+id;
        db.query(query,function(err,res){
            if (!err){
                if (res && res.length){
                    data['NSLeft'] = res[0].NSRight;
                    data['NSRight'] = res[0].NSRight+1;
                    data['TreeId'] = res[0].TreeId;
                    data['NSLevel'] = res[0].NSLevel+1;

                    // Обновление дерева
                    query = 'UPDATE '+table+' SET NSRight = NSRight + 2, NSLeft = IF(NSLeft > '+res[0].NSRight+', NSLeft + 2, NSLeft) WHERE NSRight >= '+res[0].NSRight+ " AND TreeId="+res[0].TreeId;
                    db.query(query,function(err){
                        if (!err){
                            db.insert(table,data,function(err,res){
                                callback(err,res);
                            })
                        }
                        else {
                            callback(err,"Ошибка пересчета ключей при вставке элемента");
                        }
                    });
                }
                else {
                    callback(err,"Родитель для вставки отсутствует");
                }
            }
            else {
                callback(err,"Ошибка при запросе родителя для вставляемого элемента");
            }
        });
    },
    /*
        Удаляет узел с уникальным номером id и всех его детей.
            table - таблица
            condition – дополнительные условия для запроса

            Возвращает TRUE – удача - или FALSE – не удача.
    */
    deleteAll: function(id,table,condition,callback){
        NestedSets.getNodeInfo(id,table,function(err,node){
            var sql,deltaId;
            if (!err){
                if (!node){
                    callback(null,false);
                }
                else {
                    sql = 'DELETE FROM ' + table + ' WHERE NSLeft BETWEEN ' + node['NSLeft'] + ' AND ' + node['NSRight'] + ' AND TreeId = '+node['TreeId'];
                    db.query(sql,function(err){
                        if (!err){
                            deltaId = ((node['NSRight'] - node['NSLeft']) + 1);
                            sql = 'UPDATE ' + table + ' SET '
                                + 'NSLeft = CASE WHEN NSLeft > ' + node['NSLeft']+ ' THEN NSLeft - ' + deltaId + ' ELSE NSLeft END, '
                                + 'NSRight = CASE WHEN NSRight > ' + node['NSLeft'] + ' THEN NSRight - ' + deltaId + ' ELSE NSRight END '
                                + 'WHERE NSRight > ' + node['NSRight'] + ' AND TreeId = '+node['TreeId'];
                            sql += condition;
                            db.query(sql,function(err,data){
                                if (err || !data){
                                    callback(err,false);
                                }
                                else {
                                    callback(null,true)
                                }
                            });
                        }
                        else {
                            callback(err,false);
                        }
                    });
                }
            }
            else {
                callback(err,false);
            }
        });
    },




    /*
        Перемещает узел с номером
            id - id перемещаемого узла
            parentId - id нового родителя
            table - таблица,
            condition - дополнительные условия

        Не допускается перемещение узлов в рамках одного родителя.
        Возвращает TRUE – удача - или FALSE – не удача.
    */
    moveAll: function(id,parentId,table,condition,callback){
        if (!id || !parentId || !table){
            callback(null,false);
            return;
        }
        NestedSets.getNodeInfo(id,table,function(err,node){
            if (err || !node){
                callback(err,false);
                return;
            }
            NestedSets.getNodeInfo(parentId,table,function(err,parent){
                if (err || !parent){
                    callback(err,false);
                    return;
                }
                if (id == parentId || node.TreeId != parent.TreeId || node.NSLeft == parent.NSLeft || (parent.NSLeft >= node.NSLeft && parent.NSLeft <= node.NSRight) || (node.NSLevel == parent.NSLevel+1 && node.NSLeft > parent.NSLeft && node.NSRight < parent.NSRight)) {
                    callback(null,false);
                    return;
                }
                var query = "";

                if (parent.NSLeft < node.NSLeft && parent.NSRight > node.NSRight && parent.NSLevel < node.NSLevel - 1) {
                    query = 'UPDATE ' + table + ' SET '
                        + 'NSLevel = CASE WHEN  NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN  NSLevel + '+(parent.NSLevel-(node.NSLevel-1))+ ' ELSE NSLevel END, '
                        + 'NSRight = CASE WHEN  NSRight BETWEEN ' + (node.NSRight+1) + ' AND ' + (parent.NSRight-1) + ' THEN NSRight -' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN  NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSRight +' + (((parent.NSRight-node.NSRight-node.NSLevel+parent.NSLevel)/2)*2+node.NSLevel-parent.NSLevel-1) + ' ELSE NSRight END, '
                        + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + (node.NSRight+1) + ' AND ' + (parent.NSRight-1) + ' THEN NSLeft - ' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN  NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSLeft + ' + (((parent.NSRight-node.NSRight-node.NSLevel+parent.NSLevel)/2)*2+node.NSLevel-parent.NSLevel-1) + ' ELSE NSLeft END '
                        + 'WHERE TreeId = ' + node['TreeId'] + ' AND  NSLeft BETWEEN ' + (parent.NSLeft+1) + ' AND ' + (parent.NSRight-1);
                }
                else if (parent.NSLeft < node.NSLeft) {
                    query = 'UPDATE ' + table + ' SET '
                        + 'NSLevel = CASE WHEN NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSLevel +' +(parent.NSLevel-(node.NSLevel-1)) + ' ELSE NSLevel END, '
                        + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + parent.NSRight + ' AND ' + (node.NSLeft-1) + ' THEN NSLeft + ' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSLeft -' + (node.NSLeft-parent.NSRight) + ' ELSE NSLeft END, '
                        + 'NSRight = CASE WHEN NSRight BETWEEN ' + parent.NSRight + ' AND ' + node.NSLeft + ' THEN NSRight +' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN NSRight BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSRight - ' + (node.NSLeft-parent.NSRight) + ' ELSE NSRight END '
                        + 'WHERE TreeId = ' + node['TreeId'] + ' AND  (NSLeft BETWEEN ' + parent.NSLeft + ' AND ' + node.NSRight+ ' '
                        + 'OR NSRight BETWEEN ' + parent.NSLeft + ' AND ' + node.NSRight + ')';
                }
                else {
                    query = 'UPDATE ' + table + ' SET '
                        + 'NSLevel = CASE WHEN NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSLevel +' +(parent.NSLevel-(node.NSLevel-1)) + ' ELSE NSLevel END, '
                        + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + node.NSRight + ' AND ' + parent.NSRight + ' THEN NSLeft -' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN NSLeft BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSLeft +' + (parent.NSRight-1-node.NSRight) + ' ELSE NSLeft END, '
                        + 'NSRight = CASE WHEN NSRight BETWEEN ' + (node.NSRight+1) + ' AND ' + (parent.NSRight-1) + ' THEN NSRight -' + (node.NSRight-node.NSLeft+1) + ' '
                        + 'WHEN NSRight BETWEEN ' + node.NSLeft + ' AND ' + node.NSRight + ' THEN NSRight +' + (parent.NSRight-1-node.NSRight) + ' ELSE NSRight END '
                        + 'WHERE TreeId = ' + node['TreeId'] + ' AND (NSLeft BETWEEN ' + node.NSLeft + ' AND ' + parent.NSRight + ' OR NSRight BETWEEN ' + node.NSLeft + ' AND ' + parent.NSRight + ')';
                }

                db.query(query,function(err,data){
                    if (err || !data){
                        callback(err,false);
                    }
                    else {
                        callback(null,true)
                    }
                });
            });
        });
    },
    /*  Меняет порядок детей у одного родителя в рамках одного уровня.
        Все дети переносимого элемента также перемещаются вместе с ним, сохраняя иерархию.
            id1 - уникальный номер перемещаемого узла (все его дети будут перемещены вместе с ним),
            id2 уникальный номер элемента, относительно которого будет происходить перемещение.
            position - позиция, в которую будет помещен переносимый элемент (id1) относительно
            другого элемента (id2): 'after' - переносимый элемент (id1) будет поставлен после
            указанного элемента (id2), 'before' - переносимый элемент (id1) будет поставлен перед
            указанным (id2).
        Возвращает TRUE – удача - или FALSE – не удача.
    */
    changePositionAll: function (id1, id2, position, table,condition,cb) {
        var sql ="";
        if (!position){
            position = "after";
        }
        if (!id1 || !id2 || !table){
            cb(null,false);
            return;
        }
        NestedSets.getNodeInfo(id1,table,function(err,node1) {
            if (err || !node1) {
                cb(err, false);
                return;
            }
            NestedSets.getNodeInfo(id2, table, function (err, node2) {
                if (err || !node2) {
                    cb(err, false);
                    return;
                }

                if (node1.TreeId != node2.TreeId){
                    cb(null, false);
                    return;
                }

                if (node1.NSLevel != node2.NSLevel) {
                    cb(null, false);
                    return;
                }

                if ('before' == position) {
                    if (node1.NSLeft > node2.NSLeft) {

                        sql = 'UPDATE ' + table + ' SET '
                            + 'NSRight = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSRight - ' + (node1.NSLeft - node2.NSLeft) + ' '
                            + 'WHEN NSLeft BETWEEN ' + node2.NSLeft + ' AND ' + (node1.NSLeft - 1) + ' THEN NSRight +  ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSRight END, '
                            + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSLeft - ' + (node1.NSLeft - node2.NSLeft) + ' '
                            + 'WHEN NSLeft BETWEEN ' + node2.NSLeft + ' AND ' + (node1.NSLeft - 1) + ' THEN NSLeft + ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSLeft END '
                            + 'WHERE TreeId = '+node1.TreeId+' AND NSLeft BETWEEN ' + node2.NSLeft + ' AND ' + node1.NSRight;
                    } else {
                        sql = 'UPDATE ' + table + ' SET '
                            + 'NSRight = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSRight + ' + ((node2.NSLeft - node1.NSLeft) - (node1.NSRight - node1.NSLeft + 1)) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node1.NSRight + 1) + ' AND ' + (node2.NSLeft - 1) + ' THEN NSRight - ' + ((node1.NSRight - node1.NSLeft + 1)) + ' ELSE NSRight END, '
                            + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSLeft + ' + ((node2.NSLeft - node1.NSLeft) - (node1.NSRight - node1.NSLeft + 1)) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node1.NSRight + 1) + ' AND ' + (node2.NSLeft - 1) + ' THEN NSLeft - ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSLeft END '
                            + 'WHERE TreeId = '+node1.TreeId+' AND NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + (node2.NSLeft - 1);
                    }
                }
                if ('after' == position) {
                    if (node1.NSLeft > node2.NSLeft) {
                        sql = 'UPDATE ' + table + ' SET '
                            + 'NSRight = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSRight - ' + (node1.NSLeft - node2.NSLeft - (node2.NSRight - node2.NSLeft + 1)) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node2.NSRight + 1) + ' AND ' + (node1.NSLeft - 1) + ' THEN NSRight +  ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSRight END, '
                            + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSLeft - ' + (node1.NSLeft - node2.NSLeft - (node2.NSRight - node2.NSLeft + 1)) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node2.NSRight + 1) + ' AND ' + (node1.NSLeft - 1) + ' THEN NSLeft + ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSLeft END '
                            + 'WHERE TreeId = '+node1.TreeId+' AND NSLeft BETWEEN ' + (node2.NSRight + 1) + ' AND ' + node1.NSRight;
                    } else {
                        sql = 'UPDATE ' + table + ' SET '
                            + 'NSRight = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSRight + ' + (node2.NSRight - node1.NSRight) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node1.NSRight + 1) + ' AND ' + node2.NSRight + ' THEN NSRight - ' + ((node1.NSRight - node1.NSLeft + 1)) + ' ELSE NSRight END, '
                            + 'NSLeft = CASE WHEN NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node1.NSRight + ' THEN NSLeft + ' + (node2.NSRight - node1.NSRight) + ' '
                            + 'WHEN NSLeft BETWEEN ' + (node1.NSRight + 1) + ' AND ' + node2.NSRight + ' THEN NSLeft - ' + (node1.NSRight - node1.NSLeft + 1) + ' ELSE NSLeft END '
                            + 'WHERE TreeId = '+node1.TreeId+' AND NSLeft BETWEEN ' + node1.NSLeft + ' AND ' + node2.NSRight;
                    }
                }
                db.query(sql,function(err,data){
                    if (err || !data){
                        cb(err,false);
                    }
                    else {
                        cb(null,true)
                    }
                });
            });
        });
    }
};
module.exports = NestedSets;