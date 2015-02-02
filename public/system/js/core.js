(function (){
    function _core(){
        this.getForm = function(id,selector){
            $.ajax({
                url: "/api/getform",
                data:{id:id},
                success: function(data){
                    var form = "<form id='form_api_%id%' method='%method%' action='%action%' class='%class%' style='%style%'><input type='hidden' name='formid' value='%id%'/> %fields%</form>";
                    form = form.replace(/%id%/g,data.form.id);
                    form = form.replace("%method%",data.form.method);
                    form = form.replace("%action%",data.form.action);
                    form = form.replace("%class%",data.form.class);
                    form = form.replace("%style%",data.form.style);
                    form = form.replace("%fields%",data.fields);

                    $(selector).html(form);

                    core.initForm("#form_api_"+data.form.id,data.form.action,data.form.method,data.form.yacode,data.form.yatarget);
                }
            });
        };
        this.initForm = function(id,action,method,yacode,yatarget){
            $(id).on("submit",function(event){
                event.preventDefault();
                $.ajax({
                    url: action,
                    method: method,
                    data:$(id).serialize(),
                    success: function(data){
                        var ya = "yaCounterXXXXXX";
                        if (data.length){
                            modal({
                                title: "Отправка формы",
                                content: {html: "Не все поля были заполнены. Укажите необходимые данные и попробуйте снова"},
                                buttons:[
                                    {
                                        title:"Закрыть",
                                        class: "btn btn-green",
                                        click: function(){this.close();}
                                    }
                                ]
                            });
                        }
                        else {
                            if (yacode && yatarget){
                                ya = ya.replace("XXXXXX",yacode);
                                var yandex = eval(ya);
                                yandex.reachGoal(yatarget);
                            }
                            modal({
                                title: "Отправка формы",
                                content: {html: "Данные успешно отправлены"},
                                buttons:[
                                    {
                                        title:"Закрыть",
                                        class: "btn btn-green",
                                        click: function(){this.close();}
                                    }
                                ]
                            });
                            $(id).trigger('reset');
                        }
                    }
                });

            });
        };
    }
    window.core = new _core();
})();