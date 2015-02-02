var adminApp = angular.module("admin",['ngSanitize'])
    .value('uiTinymceConfig', {})
    .directive('uiTinymce', ['uiTinymceConfig', function(uiTinymceConfig) {
        var generatedIds = 0;
        uiTinymceConfig = uiTinymceConfig || {};

        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ngModel) {
                var expression, options, tinyInstance;
                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'uiTinymce' + generatedIds++);
                }
                options = {
                    language : 'ru',
                    visualblocks_default_state: true,
                    theme: "modern",
                    menubar: false,
                    fontsize_formats: "6px 7px 8px 9px 10px 11px 12px 13px 14px 15px 16px 17px 18px 19px 20px 21px 22px 23px 24px 25px 26px 27px 28px 29px 30px 31px 32px 36px 38px 40px",
                    font_size_style_values: ["6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,17px,18px,19px,20px,21px,22px,23px,24px,25px,26px,27px,28px,29px,30px,31px,32px,36px,38px,40px"],
                    plugins: [
                        "advlist autolink lists link charmap preview hr anchor ",
                        "searchreplace wordcount visualblocks visualchars code",
                        "insertdatetime nonbreaking table contextmenu directionality",
                        "template paste textcolor colorpicker textpattern example"
                    ],
                    extended_valid_elements: "button[accesskey|charset|class|contenteditable|contextmenu|coords|dir|download|draggable|dropzone|hidden|href|hreflang|id|lang|media|name|rel|rev|shape|spellcheck|style|tabindex|target|title|translate|type|onclick|onfocus|onblur]," +
                        "a[accesskey|charset|class|contenteditable|contextmenu|coords|dir|download|draggable|dropzone|hidden|href|hreflang|id|lang|media|name|rel|rev|shape|spellcheck|style|tabindex|target|title|translate|type|onclick|onfocus|onblur]",


                    toolbar1: "preview fullscreen | styleselect alignleft aligncenter alignright alignjustify bullist numlist outdent indent forecolor fontsizeselect | link anchor code example table",
                    image_advtab: true,
                    file_browser_callback: function(field_name, url, type, win) {
                        if(type=='image') $('#my_form input').click();
                    },
                    setup: function(ed) {
                        ed.on('init', function(args) {
                            ngModel.$render();
                        });
                        // Update model on button click
                        ed.on('ExecCommand', function(e) {
                            ed.save();
                            ngModel.$setViewValue(elm.val());
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                        // Update model on keypress
                        ed.on('KeyUp', function(e) {
                            ed.save();
                            ngModel.$setViewValue(elm.val());
                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                    },
                    mode: 'exact',
                    elements: attrs.id,
                    /*entity_encoding: "raw"*/
                };
                if (attrs.uiTinymce) {
                    expression = scope.$eval(attrs.uiTinymce);
                } else {
                    expression = {};
                }
                angular.extend(options, uiTinymceConfig, expression);
                setTimeout(function() {
                    tinymce.init(options);
                });


                ngModel.$render = function() {
                    if (!tinyInstance) {
                        tinyMCE.editors = []
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {

                        tinyInstance.setContent(ngModel.$viewValue || '');
                    }
                };
            }
        };
    }])
    .directive('mySortable',function(){
        return {
            link:function(scope,el,attrs){
                el.sortable({
                    revert: true,
                    connectWith:".sortable",
                    update: function(event, ui){
                        var arr = ui.item.parent().children();
                        var child = [];

                        var data = {
                            position: attrs.mySortable,
                            id: angular.element(ui.item).data("id")
                        };


                        if (ui.item.attr("draggable-from") == "main"){
                            arr.each(function(i){
                                var id = angular.element(arr[i]).data("id");
                                if (id){
                                    child.push(id);
                                }
                            });
                            data['child'] = child.join(",");
                            scope.$emit('createWidget',data);
                            ui.item.remove();

                        }
                        else {
                            if (this === ui.item.parent()[0]) {
                                arr.each(function(i){
                                    var id = angular.element(arr[i]).data("id");
                                    if (id){
                                        child.push(id);
                                    }
                                });
                                data['child'] = child.join(",");

                                if (ui.sender !== null) {
                                    scope.$emit('moveWidget',data);
                                } else {
                                    scope.$emit('sortWidget',data);
                                }
                            }
                        }
                    }
                });
            }
        }
    })
    .directive('myDraggable',function(){
        return {
            link:function(scope,el,attrs){
                if (attrs.draggableFrom == "main"){
                    el.draggable({
                        connectToSortable: attrs.myDraggable,
                        revert: "invalid",
                        helper: "clone"
                    });
                    el.disableSelection();
                }
            }
        }

    })
    .filter('getById', function() {
        return function(input, id) {
            var i=0, len=input.length;
            for (; i<len; i++) {
                if (+input[i].id == +id) {
                    return input[i];
                }
            }
            return null;
        }
    })
    .directive("controllersList",function($http,$compile){
        return {
            restrict: "E",
            link: function(scope, element){
                var tpl ="<ul>";
                var last_title;
                $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
                $http.get("/admin/widgets",{params:{do:"getControllers"}}).success(function(data){
                    tpl+='<li><button  ng-class="target == \'*\'? \'btn-red\':\'\'"  class="btn btn-blue btn-small width-100 root" ng-click="getWidgetsBind(\'*\')">Все страницы</button></li>'
                    data.controllers.forEach(function(item,i){

                            if (last_title != item.c_title){
                            tpl +='<li><button class="btn btn-blue btn-small width-100 root">'+item.c_title+'</button>'

                            tpl +='<ul class="child">'
                            tpl+= '<li><a href="javascript:void(0)" ng-class="{\'active\':target==\''+item.target+'\'}"  ng-click="getWidgetsBind(\''+item.target+'\')">'+item.a_title+'</a></li>'
                            last_title =  item.c_title;
                            } else {
                            tpl+='<li><a href="javascript:void(0)" ng-class="{\'active\':target==\''+item.target+'\'}"  ng-click="getWidgetsBind(\''+item.target+'\')">'+item.a_title+'</a></li>'
                            }

                        if (!data.controllers[i+1] || item.c_title != data.controllers[i+1].c_title){
                            tpl+='</ul></li>'
                            }
                    });
                    tpl +="</ul>";
                    element.append($compile(tpl)(scope));
                    $(".root").on("click",function(){
                        var $child = $(this).parent().children("ul");
                        $child.toggle();
                    });

                });
            }
        }
    })
    .directive("offsetTitle",function(){
        return {
            restrict: "A",
            link: function (scope, element, attributes) {
                var offset = '';
                for (var i=0; i<attributes.offsetLevel; i++){
                    offset+="&bull; ";
                }
                element.html(offset+attributes.offsetTitle);
            }
        }
    })
    .controller("navigation",function($scope,$http,$filter,$compile){
        $scope.groups = [];
        $scope.menuLists = [];
        $scope.info = 1;
        $scope.group = {
            id:0,
            title:''
        };
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $http.get("/admin/navigation?do=getGroups").success(function(data){
            $scope.groups =data.groups;
        });

        $scope.createGroup = function(){
            var createData = {
                do:'getTemplate',
                tpl:"editGroup"
            };
            $http.get("/admin/navigation",{ params: createData}).success(function(data){
                $scope.modal = modal(
                    {
                        title:"Создание группы меню",
                        content:{html:data},
                        buttons:
                            [
                                {
                                    title:"Создать",
                                    class:"btn btn-green",
                                    click: function(){
                                        var data = {
                                            do:"createGroup",
                                            csrf: $("input[name='n_csrf']").val(),
                                            title: $("input[name='n_title']").val()
                                        };
                                        if (data.title){
                                            $http.get("/admin/navigation",{params:data}).success(function(req){
                                                $scope.groups = req.groups;
                                                //$scope.group.id = req.id;
                                            });
                                        }
                                        this.close();
                                    }
                                },
                                {
                                    title: "Отмена",
                                    class: "btn",
                                    click: function(){
                                        this.close();
                                    }
                                }
                            ]
                    });
            });
        };
        $scope.deleteGroup = function(){
            $http.get("/admin/navigation",{ params: {do:'getTemplate', tpl:"deleteGroup"}}).success(function(data){
                $scope.modal = modal(
                    {
                        title:"Удаление группы меню",
                        content:{html:data},
                        buttons:
                            [
                                {
                                    title:"Удалить",
                                    class:"btn btn-red",
                                    click: function(){
                                        var data = {
                                            do:"deleteGroup",
                                            csrf: $("input[name='n_csrf']").val(),
                                            id : $scope.group.id
                                        };
                                        $http.get("/admin/navigation",{ params: data}).success(function(data){
                                            $scope.groups =data.groups;
                                            $scope.group.id = 0;
                                            $scope.info = 1;
                                        });
                                        this.close();
                                    }
                                },
                                {
                                    title: "Отмена",
                                    class: "btn",
                                    click: function(){
                                        this.close();
                                    }
                                }
                            ]
                    });
            });
        };
        $scope.editGroup = function(){
            var editData = {
                do:'getTemplate',
                tpl:"editGroup",
                id: $scope.group.id
            };
            $http.get("/admin/navigation",{params:editData}).success(function(tpl){
                $scope.modal = modal(
                    {
                        title:"Редактирование группы меню",
                        content:{html:tpl},
                        buttons:
                            [
                                {
                                    title:"Сохранить",
                                    class:"btn btn-green",
                                    click: function(){
                                        var data = {
                                            do:"saveGroup",
                                            title: $("input[name='n_title']").val(),
                                            csrf: $("input[name='n_csrf']").val(),
                                            id : $scope.group.id
                                        };
                                        $http.get("/admin/navigation",{ params: data}).success(function(data){
                                            var found = $filter("getById")($scope.menuLists,$scope.group.id);
                                            found.title = $scope.group.title = data.title;
                                            $scope.groups = data.groups;
                                        });
                                        this.close();
                                    }
                                },
                                {
                                    title: "Отмена",
                                    class: "btn",
                                    click: function(){
                                        this.close();
                                    }
                                }
                            ]
                    });
            });
        };

        $scope.getSelected = function(ind,nsleft,nsright,nslevel){
            if (nsleft > $scope.menuLists[ind]['NSLeft'] && nsright < $scope.menuLists[ind]['NSRight']){
                if (nslevel-1 == $scope.menuLists[ind]['NSLevel']){
                    return true;
                }
            }
        };

        $scope.getItems = function(id){
            $http.get("/admin/navigation",{ params: {do:'getGroup',id:id}}).success(function(data){
                $scope.info = 0;
                $scope.menuLists = data.group;
                var found = $filter('getById')($scope.groups, id);
                $scope.group.id = found.id;
                $scope.group.title = found.title;
            });
        };
        $scope.createItem = function(){
            var data = {
                do:'getTemplate',
                tpl:"editItem"
            };
            $http.get("/admin/navigation",{params:data}).success(function(data){
                var tpl = $compile(data)($scope);
                $scope.modal = modal({
                    title:"Создание пункта меню",
                    content:{
                        html:tpl
                    },
                    buttons:[
                        {
                            title:"Создать",
                            class:"btn btn-green",
                            click: function(){

                                var dataEdit = {
                                    csrf: $("input[name='n_csrf']").val(),
                                    title:$("input[name='n_title']").val(),
                                    root:$("select[name='n_root']").val(),
                                    target:$("select[name='n_target']").val(),
                                    enabled:$("select[name='n_enabled']").val(),
                                    url:$("input[name='n_url']").val(),
                                    do:'editItem',
                                    access: $("select[name='n_access']").val()
                                };


                                if (!dataEdit.csrf || !dataEdit.title || !dataEdit.root || !dataEdit.url){
                                    this.close();
                                }
                                else {
                                    $http.get("/admin/navigation",{params:dataEdit}).success(function(data){
                                        $scope.menuLists = data.group;
                                        $scope.modal.close();
                                    });
                                }
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ this.close(); }
                        }
                    ]
                });
            });
        };
        $scope.deleteItem = function(id){
            var data = {
                tpl:"deleteItem",
                do: "getTemplate"
            };
            $http.get("/admin/navigation", {params:data}).success(function(tpl){
                $scope.modal = modal({
                    title:"Удаление пункта меню",
                    content:{
                        html:tpl
                    },
                    buttons:[
                        {
                            title:"Ок",
                            class:"btn btn-red",
                            click: function(){
                                var deleteData = {
                                    do:'deleteItem',
                                    id:id,
                                    root:$scope.group.id,
                                    csrf: $("input[name='n_csrf']").val()
                                };
                                $http.get("/admin/navigation",{params:deleteData}).success(function(data){
                                    $scope.menuLists = data.group;
                                });
                                this.close();
                            }
                        },
                        {
                            title:"Отмена",
                            class: "btn",
                            click: function(){
                                this.close();
                            }
                        }
                    ]
                });
            });
        };
        // bool: false - двигаем вверх, true - двигаем вниз
        $scope.pushItem = function(from,to,bool){
            if ((from == 0 && !bool) || ((from == ($scope.menuLists.length-2)) && bool)){
                return;
            }
            from = from+1
            var ind = from;
            var index = 0;
            var lvl = $scope.menuLists[from].NSLevel;
            var obj = {
                do: "pushitem",
                id: $scope.menuLists[from].id,
                to: -1,
                sort: bool
            };

            var el;
            var count2;
            var count1 = Math.ceil(($scope.menuLists[from].NSRight-$scope.menuLists[from].NSLeft)/2);
            if (false === bool){
                while(ind>0){
                    if ($scope.menuLists[ind].NSLevel == lvl && ind<from){
                        obj.to = $scope.menuLists[ind].id;
                        index = ind;
                        count2 = Math.ceil(($scope.menuLists[ind].NSRight-$scope.menuLists[ind].NSLeft)/2);
                        break;
                    }
                    ind--;
                }
            }
            if (true === bool){
                while(ind<$scope.menuLists.length){
                    if ($scope.menuLists[ind].NSLevel == lvl && ind>from){
                        obj.to = $scope.menuLists[ind].id;
                        index = ind-count1+1;
                        count2 = Math.ceil(($scope.menuLists[ind].NSRight-$scope.menuLists[ind].NSLeft)/2);
                        break;
                    }
                    ind++;
                }
            }
            if (obj.to == -1){
                return;
            }
            $http.post("/admin/navigation",obj).success(function(){
                el = $scope.menuLists.splice(from,count1);
                if (count2>1 && bool){
                    index = index+count2;
                }
                for (var i = 0; i<el.length; i++){
                    $scope.menuLists.splice(index+i,0,el[i]);
                }
            });
        };
        $scope.editItem = function(id){
            var data = {
                do: "getTemplate",
                tpl:"editItem",
                id:id
            };
            $http.get("/admin/navigation",{params:data}).success(function(data){

                var tpl = $compile(data)($scope);
                $scope.modal = modal({
                    title:"Редактирование пункта меню",
                    content:{
                        html:tpl
                    },
                    buttons:[
                        {
                            title:"Ок",
                            class:"btn btn-green",
                            click: function(){

                                var dataEdit = {
                                    csrf: $("input[name='n_csrf']").val(),
                                    title:$("input[name='n_title']").val(),
                                    root:$("select[name='n_root']").val(),
                                    url:$("input[name='n_url']").val(),
                                    target:$("select[name='n_target']").val(),
                                    enabled:$("select[name='n_enabled']").val(),
                                    menu_id:$scope.group.id,
                                    do:'editItem',
                                    access: $("select[name='n_access']").val(),
                                    id:id
                                };

                                if (!dataEdit.csrf || !dataEdit.title || !dataEdit.root || !dataEdit.url){
                                    this.close();
                                }
                                else {
                                    $http.get("/admin/navigation",{params:dataEdit}).success(function(data){
                                        $scope.menuLists = data.group;
                                        $scope.modal.close();
                                    });
                                }
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ this.close(); }
                        }
                    ]
                });
            });
        };
    })
    .controller("users",function($scope,$http) {
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.groups = [];
        $scope.users = [];
        $scope.getUsers = function(){
            $http.get("/admin/users",{params:{do:"getUsers"}}).success(function(data){
                $scope.users = data.users;
            });
        };
        $scope.getUsers();
        $scope.getGroups = function(){
            $http.get("/admin/users",{params:{do:"getUsersGroups"}}).success(function(data){
                $scope.groups = data.groups;
            });
        };
        $scope.getGroups();
        $scope.createGroup = function(){
            $http.get("/admin/users",{params:{do:"getTemplate",tpl:"editGroup"}}).success(function(data){
                $scope.modal = modal({title:"Создание группы пользователей",content:{html:data},buttons:[
                    {
                        title: "Создать",
                        class: "btn btn-green",
                        click: function(){
                            var newGroup = {
                                do: "saveUserGroup",
                                csrf: $("input[name='u_csrf']").val(),
                                title: $("input[name='u_title']").val(),
                                role: $("input[name='u_role']").val()
                            };
                            $http.get("/admin/users",{params:newGroup}).success(function(data){
                                $scope.modal.close();
                                $scope.groups = data.groups;
                            });
                        }
                    },
                    {
                        title: "Отмена",
                        class: "btn",
                        click: function(){ this.close(); }
                    }
                ]});
            });
        };
        $scope.editGroup = function(id){
            var data = {
                do: "getTemplate",
                tpl: "editGroup",
                id:id
            };

            $http.get("/admin/users",{params:data}).success(function(data){
                $scope.modal = modal({
                    title: "Редактирование группы пользователей",
                    content: {
                        html:data
                    },
                    buttons: [
                        {
                            title: "Сохранить",
                            class:"btn btn-green",
                            click : function(){
                                var saveData = {
                                    id:id,
                                    csrf: $("input[name='u_csrf']").val(),
                                    title: $("input[name='u_title']").val(),
                                    role: $("input[name='u_role']").val(),
                                    do: "saveUserGroup"

                                };
                                $http.get("/admin/users",{params:saveData}).success(function(data){
                                    $scope.groups = data.groups;
                                    $scope.modal.close();
                                });
                            }
                        },
                        {
                            title: "Удалить",
                            class:"btn btn-red",
                            click : function(){
                                $http.get("/admin/users",{params:{do:"getTemplate", tpl:"deleteUserGroup"}}).success(function(data){
                                    $scope.modal.close();
                                    $scope.modal = modal({title:"Удаление группы пользователей", content:{html:data}, buttons:[
                                        {
                                            title: "Удалить",
                                            class:"btn btn-red",
                                            click: function(){
                                                var deleteData = {
                                                    do:"deleteUserGroup",
                                                    id:id,
                                                    csrf:$("input[name='u_csrf']").val()
                                                };
                                                $http.get("/admin/users",{params:deleteData}).success(function(data){
                                                    $scope.groups = data.groups;
                                                    $scope.getUsers();
                                                    $scope.modal.close();
                                                });
                                            }
                                        },
                                        {
                                            title: "Отмена",
                                            class:"btn",
                                            click: function(){ this.close(); }
                                        }
                                    ]});
                                });
                            }
                        },
                        {
                            title: "Отмена",
                            class:"btn",
                            click : function(){ this.close(); }
                        }
                    ]
                });
            });
        };

        $scope.createUser = function(){
            var data = {
                do: "getTemplate",
                tpl: "editUser"
            };
            $http.get("/admin/users",{params:data}).success(function(data){
                $scope.modal = modal({
                    title: "Создание пользователя",
                    content: {
                        html: data
                    },
                    buttons: [
                        {
                            title:"Создать",
                            class:"btn btn-green",
                            click: function(){
                                var createData = {
                                    do: "saveUser",
                                    csrf: $("input[name='u_csrf']").val(),
                                    login: $("input[name='u_login']").val(),
                                    email: $("input[name='u_email']").val(),
                                    pass: $("input[name='u_pass']").val(),
                                    name:$("input[name='u_name']").val(),
                                    is_banned:$("select[name='u_isbanned']").val(),
                                    usergroup:$("select[name='u_usergroup']").val()
                                };
                                $http.get("/admin/users",{params:createData}).success(function(data){
                                    if (!data.error){
                                        $scope.getUsers();
                                        $scope.modal.close();
                                    }
                                    else {
                                        for(var i=0; i<data.error.length; i++){
                                            if (data.error[i].name == "login"){
                                                $("#err_login").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "email"){
                                                $("#err_email").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "name"){
                                                $("#err_name").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "pass"){
                                                $("#err_pass").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "usergroup"){
                                                $("#err_usergroup").text(data.error[i].msg);
                                            }
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title:"Отмена",
                            class:"btn",
                            click: function(){ this.close(); }
                        }
                    ]
                });
            });
        };
        $scope.editUser = function(id){
            var data = {
                do: "getTemplate",
                tpl: "editUser",
                id:id
            };
            $http.get("/admin/users",{params:data}).success(function(data){
                $scope.modal = modal({
                    title:"Редактирование пользователя",
                    content:{html:data},
                    buttons:[
                        {
                            title:"Сохранить",
                            class:"btn btn-green",
                            click:function(){
                                var data = {
                                    do: "saveUser",
                                    csrf: $("input[name='u_csrf']").val(),
                                    login: $("input[name='u_login']").val(),
                                    email: $("input[name='u_email']").val(),
                                    pass: $("input[name='u_pass']").val(),
                                    name:$("input[name='u_name']").val(),
                                    is_banned:$("select[name='u_isbanned']").val(),
                                    usergroup:$("select[name='u_usergroup']").val(),
                                    id: id
                                };
                                $http.get("/admin/users",{params:data}).success(function(data){
                                    if (!data.error){
                                        $scope.getUsers();
                                        $scope.modal.close();
                                    }
                                    else {
                                        for(var i=0; i<data.error.length; i++){
                                            if (data.error[i].name == "login"){
                                                $("#err_login").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "email"){
                                                $("#err_email").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "name"){
                                                $("#err_name").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "pass"){
                                                $("#err_pass").text(data.error[i].msg);
                                            }
                                            if (data.error[i].name == "usergroup"){
                                                $("#err_usergroup").text(data.error[i].msg);
                                            }
                                        }
                                    }
                                });
                            }
                        },
                        {
                            title:"Удалит",
                            class:"btn btn-red",
                            click:function(){
                                var data = {
                                    do: "getTemplate",
                                    tpl: "deleteUser",
                                    id: id
                                };
                                $http.get("/admin/users",{params:data}).success(function(data){
                                    $scope.modal = modal({
                                        title:"Удаление пользователя",
                                        content:{html:data},
                                        buttons:[
                                            {
                                                title: "Удалить",
                                                class: "btn btn-red",
                                                click: function(){
                                                    var data = {
                                                        do: "deleteUser",
                                                        id:id,
                                                        csrf: $("input[name='u_csrf']").val()
                                                    };
                                                    $http.get("/admin/users",{params:data}).success(function(data){
                                                        $scope.getUsers();
                                                        $scope.modal.close();
                                                    });
                                                }
                                            },
                                            {
                                                title:"Отмена",
                                                class:"btn",
                                                click:function(){ this.close(); }
                                            }
                                        ]});
                                });
                            }
                        },
                        {
                            title:"Отмена",
                            class:"btn",
                            click:function(){ this.close(); }
                        }
                    ]});
            });
        };
    })
    .controller("access",function($scope,$http){
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.controllers = [];
        $scope.getControllers = function(){
            var data = {
                do: "getControllers"
            };
            $http.get("/admin/access",{params:data}).success(function(data){
                $scope.controllers = data.controllers;
            });
        };
        $scope.getControllers();
        $scope.editController = function(id){
            var data = {
                do: "editControllerAccess",
                id:id
            };
            $http.get("/admin/access",{params:data}).success(function(data){
                $scope.modal = modal({
                    title:"Редактирование доступа",
                    content:{html:data},
                    buttons:[
                        {
                            title:"Сохранить",
                            class:"btn btn-green",
                            click: function(){
                                var saveData = {
                                    do: "saveControllerAccess",
                                    csrf: $("input[name='c_csrf']").val(),
                                    id: $("input[name='c_id']").val(),
                                    usergroup: $("select[name='c_usergroup']").val()
                                };
                                $http.get("/admin/access",{params:saveData}).success(function(data){
                                    $scope.getControllers();
                                    $scope.modal.close();
                                });
                            }
                        },
                        {
                            title:"Отмена",
                            class:"btn",
                            click: function(){ this.close(); }
                        }
                    ]
                });
            });
        }
    })
    .controller("widgets",function($scope,$http,$filter,$compile){
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.target = '';
        $scope.title = '';
        $scope.widgets = [];
        $scope.widgetsBind = [];
        $scope.scheme = "";

        $scope.$on("createWidget",function(a,b){
            b["target"] = $scope.target;
            b["do"] = "getTemplate";
            b["tpl"] = "createWidget";
            $http.get("/admin/widgets",{params:b}).success(function(html){
                var tpl = $compile(html)($scope);
                $scope.modal = modal({
                    title:"Новый виджет",
                    content:{html:tpl},
                    buttons:[
                        {
                            title:"Сохранить",
                            class: "btn btn-green",
                            click: function(){
                                var data = {
                                    do:"createWidget"
                                };
                                var fields = $("#widgetForm").find("input,select,textarea");

                                fields.each(function(){
                                    data[this.name] = $(this).val();
                                });
                                $http.get("/admin/widgets",{params:data}).success(function(data){
                                    $scope.widgetsBind = data.widgets;
                                });
                                this.close()
                            }
                        },
                        {
                            title:"Отмена",
                            class: "btn",
                            click: function(){
                                this.close();
                            }
                        }

                    ],
                    width: 1200
                });
            });
        });
        $scope.$on("moveWidget",function(a,b){
            b["target"] = $scope.target;
            b["do"] = "moveWidgets";
            $http.get("/admin/widgets",{params:b}).success(function(data){
                $scope.widgetsBind = data.widgets;
            });
        });
        $scope.$on("sortWidget",function(a,b){
            b["target"] = $scope.target;
            b["do"] = "sortWidgets";
            $http.get("/admin/widgets",{params:b}).success(function(data){
                $scope.widgetsBind = data.widgets;
            });
        });
        $scope.getWidgets = function(){
            $http.get("/admin/widgets",{params:{do:"getWidgets"}}).success(function(data){
                $scope.widgets = data.widgets;
            });
        };
        $scope.getWidgets();
        $scope.getWidgetsBind = function(target){
            $scope.target = target;
            $http.get("/admin/widgets",{params:{do:"getWidgetsBind",target:target}}).success(function(data){
                $scope.widgetsBind = data.widgets;
            });
        };
        $scope.deleteWidget = function(id){
            var data = {
                do: "getTemplate",
                tpl: "deleteWidget"
            };
            $http.get("/admin/widgets",{params:data}).success(function(data){
                $scope.modal = modal({
                    title:"Удаление виджета",
                    content:{
                        html:data
                    },
                    buttons:[
                        {
                            title:"Удалить",
                            class: "btn btn-red",
                            click:function(){
                                var data = {
                                    do:"deleteWidget",
                                    csrf: $("input[name='w_csrf']").val(),
                                    id:id
                                };
                                $http.get("/admin/widgets",{params:data}).success(function(){
                                    var widget = $filter("getById")($scope.widgetsBind,id);
                                    var pos = $scope.widgetsBind.indexOf(widget);
                                    if (pos >= 0){
                                        $scope.widgetsBind.splice(pos,1);
                                    }
                                });
                                $scope.modal.close();
                            }
                        },
                        {
                            title:"Отмена",
                            class: "btn",
                            click:function(){
                                this.close();
                            }
                        }
                    ]
                });
            });
        };
        $scope.editWidget = function(id){
            var data = {
                do: "getTemplate",
                tpl: "editWidget",
                id:id
            };
            $http.get("/admin/widgets",{params:data}).success(function(data){
                var tpl = $compile(data)($scope);
                $scope.modal = modal({
                    title:"Редактирование виджета",
                    content:{
                        html: tpl
                    },
                    buttons:[
                        {
                            title: "Сохранить",
                            class: "btn btn-green",
                            click: function(){
                                var data = {
                                    do:"saveWidget"
                                };
                                var fields = $("#widgetForm").find("input,select,textarea");

                                fields.each(function(){
                                    data[this.name] = $(this).val();
                                });
                                $http.post("/admin/widgets",data).success(function(){
                                    var widget = $filter("getById")($scope.widgetsBind,id);
                                    widget.title = data.title;
                                    widget.enabled = parseInt(data.enabled);
                                });
                                $scope.modal.close();
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){
                                this.close();
                            }
                        }
                    ],
                    width: 1200

                });
            });
        };
        $scope.switchWidget = function(id){
            $http.get("/admin/widgets",{params:{do:"switchWidget",id:id}}).success(function(){
                var found = $filter('getById')($scope.widgetsBind,id);
                found.enabled = !found.enabled;
            });
        };
    })
    .controller("content",function($scope,$http,$compile){

        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.ctype = 0;
        $scope.ctypes = [];
        $scope.pages = [];
        $scope.total = 0;
        $scope.page = 1;
        $scope.slugExists = false;

        $scope.tess = 0;
        $scope.submitted = false;
        $scope.menuGroups = [];

        $http.get("/admin/navigation?do=getGroups").success(function(data){
            $scope.menuGroups = data.groups;
        });

        $scope.newPageData = {
            do:"createpage",
            create:"1",
            title: '',
            slug: '',
            pagetitle:'',
            TreeId:undefined,
            content:'',
            is_pub:"1",
            showtitle:"1",
            showdesc:"1",
            showchild:"1",
            seokeys:'',
            seodesc:'',
            csrf:''
        };

        $scope.updateGroupsList = function(){
            $scope.ctypes = [];
            $http.get("/admin/content",{params:{do:"view_ctypes"}}).success(function(data){
                $scope.ctypes = data.ctypes.splice(0);
            });
        };
        $scope.updateGroupsList();
        $scope.is_pub = function(p){
            if (p){
                return "Включено";
            }
            else {
                return "Выключен";
            }
        };
        $scope.view_pages = function(id,page){
            $http.get("/admin/content",{params:{do:"view_pages",id:id,page:page}}).success(function(data){
                $scope.ctype = id;
                $scope.total = data.pages;
                $scope.pages = data.child.splice(0);
                $scope.page = parseInt(data.page);
            });
        };
        $scope.checkSlugEdit = function (text,id,callback) {
            if (!text){
                return;
            }
            $http.get("/admin/content",{params:{do:"checkSlug",slug:text}}).success(function(data){
                if (data.result.length){
                    $scope.slugExists = data.result[0].id != id;
                }
                else {
                    $scope.slugExists = false;
                }
                if (callback && typeof callback == "function"){
                    callback($scope.slugExists);
                }
            });
        };
        $scope.checkSlug = function(text,callback){
            if (!$scope.newPageData.slug){
                return false;
            }
            $http.get("/admin/content",{params:{do:"checkSlug",slug:text}}).success(function(data){
                $scope.slugExists = !!(data.result.length);
                if (callback && typeof callback == "function"){
                    callback(!!(data.result.length))
                }
            });
        };
        $scope.inputPageTitle = function(){
            var text = translate($scope.newPageData.title);
            $scope.newPageData.pagetitle = $scope.newPageData.title;
            if (text){
                $scope.newPageData.slug = text.substr(0,100);
            }
        };
        $scope.inputTitleGroup = function(){
            var text = translate($scope.egroup.title);
            $scope.egroup.pagetitle = $scope.egroup.title;
            if (text){
                $scope.egroup.slug = text.substr(0,100);
            }
        };
        $scope.deletePage = function (id) {
            $http.get("/admin/content",{params:{do:"deletePage",id:id}}).success(function(data){
                var popup = modal({
                    title:"Удаление материала",
                    content: {
                        html: data
                    },
                    buttons: [
                        {
                            title: "Удалить",
                            class: "btn btn-red",
                            click: function(){
                                var obj = {
                                    csrf: angular.element("input[name='page_csrf']").val(),
                                    id: angular.element("input[name='page_id']").val(),
                                    delete: 1,
                                    do: "deletePage"
                                };
                                $http.get("/admin/content",{params:obj}).success(function(data){
                                    $scope.view_pages($scope.ctype,$scope.page);
                                    popup.close();
                                });
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ popup.close(); }
                        }
                    ]
                });
            });
        };
        $scope.create_page = function(){
            $http.get("/admin/content",{params:{do:"createpage",id:$scope.ctype}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title:"Создание нового материала",
                    content:{html:tpl},
                    buttons:[
                        {
                            title: "Создать",
                            class: "btn btn-green",
                            click: function(){
                                $scope.submitted = true;
                                $scope.$apply();
                                var titleError = Object.keys($scope.newpage.title.$error);
                                var slugError = Object.keys($scope.newpage.title.$error);
                                var parent = Object.keys($scope.newpage.TreeId.$error);
                                if (titleError.length || slugError.length || parent.length){
                                    return;
                                }
                                $scope.checkSlug($scope.newPageData.slug,function(data){
                                    if (data == false){
                                        $scope.newPageData.csrf = angular.element("input[name='newpage_csrf']").val()
                                        $http.get("/admin/content",{params:$scope.newPageData}).success(function(data){
                                            $scope.view_pages($scope.ctype,$scope.page);
                                            popup.close();
                                        });
                                    }
                                });
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ popup.close(); }
                        }
                    ],
                    width:1200
                });
            });
        };
        $scope.editPage = function(id){
            $http.get("/admin/content",{params:{do:"editPage",id:id}}).success(function(data) {
                var tpl = $compile(data)($scope);
                var popup = modal({
                                title: "Редактирование материала",
                                content: {
                                    html: tpl
                                },
                                buttons: [
                                    {
                                        title: "Сохранить",
                                        class: "btn btn-green",
                                        click: function(){
                                            $scope.submitted = true;
                                            $scope.$apply();
                                            var obj = {
                                                do:"editPage",
                                                edit:1,
                                                id: $scope.editPage.id,
                                                csrf: $scope.editPage.csrf,
                                                title: $scope.editPage.title,
                                                pagetitle: $scope.editPage.pagetitle,
                                                slug: $scope.editPage.slug,
                                                content: $scope.editPage.content,
                                                is_pub:$scope.editPage.is_pub,
                                                showtitle:$scope.editPage.showtitle,
                                                showdesc:$scope.editPage.showdesc,
                                                showchild:$scope.editPage.showchild,
                                                seokeys:$scope.editPage.seokeys,
                                                seodesc:$scope.editPage.seodesc,
                                                parent:$scope.editPage.parent,
                                                prepage:$scope.editPage.prepage,
                                                template:$scope.editPage.template
                                            };
                                            if (obj.title && obj.pagetitle && obj.slug){
                                                $scope.checkSlugEdit(obj.slug,obj.id,function(bool){
                                                    if (bool==false){
                                                        $http.get("/admin/content",{params:obj}).success(function(data){
                                                            $scope.view_pages($scope.ctype,$scope.page);
                                                            popup.close();
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    },
                                    {
                                        title: "Отмена",
                                        class: "btn",
                                        click: function(){
                                            popup.close();
                                        }
                                    }
                                ],
                                width:1200
                            });

            });
        };

        $scope.createGroup = function(){
            $http.get("/admin/content",{params:{do:"createGroup"}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Создание группы контента",
                    content:{html:tpl},
                    buttons:[
                        {
                            title: "Создать",
                            class: "btn btn-green",
                            click: function(){
                                $scope.submitted = true;
                                $scope.$apply();
                                if ($scope.egroup.title && $scope.egroup.slug && !$scope.slugExists){//
                                    $scope.egroup['do'] = "createGroup";
                                    $scope.egroup['create'] = 1;
                                    $http.get("/admin/content",{params:$scope.egroup}).success(function(data){
                                        $http.get("/admin/content",{params:{do:"view_ctypes"}}).success(function(data){
                                            $scope.updateGroupsList();
                                            popup.close();
                                        });
                                    });
                                }
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ popup.close(); }
                        }
                    ],
                    width:1200
                });
            });

        };
        $scope.checkGroup = function(id,text){
            if (!text){
                $scope.slugExists = false;
                return;
            }
            $http.get("/admin/content",{params:{do:"checkGroup",slug:text}}).success(function(data){
                if (id && data.page){
                    $scope.slugExists = data.page.id == id?false:true;
                }
                else {
                    $scope.slugExists = data.page?true:false;
                }
            });
        };

        $scope.deleteGroup  = function(){
            $http.get("/admin/content",{params:{do:"deleteGroup",id:$scope.ctype}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Удаление группы",
                    content: {html:tpl},
                    buttons: [
                        {
                            title: "Удалить",
                            class: "btn btn-red",
                            click: function(){
                                $scope.deletegroup['do'] = "deleteGroup";
                                $http.get("/admin/content",{params:$scope.deletegroup}).success(function(){
                                    $scope.ctype = 0;
                                    $scope.pages = [];
                                    $scope.total = 0;
                                    $scope.page = 1;
                                    $scope.slugExists = false;
                                    $scope.updateGroupsList();
                                    popup.close();
                                });
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){
                                popup.close();
                            }
                        }
                    ]
                });
            });
        };

        $scope.editGroup = function(){
            $http.get("/admin/content",{params:{do:"editGroup",id:$scope.ctype}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Редактирование группы",
                    content: {html:tpl},
                    buttons:[
                        {
                            title: "Сохранить",
                            class: "btn btn-green",
                            click: function(){
                                $scope.submitted = true;
                                $scope.$apply();
                                $scope.egroup['id'] = $scope.ctype;
                                $scope.egroup['edit'] = "1";
                                $scope.egroup['do'] = "editGroup";
                                if ($scope.egroup.title && $scope.egroup.slug && !$scope.slugExists){
                                    $http.get("/admin/content",{params:$scope.egroup}).success(function(){
                                        $http.get("/admin/content",{params:{do:"view_ctypes"}}).success(function(){
                                            $scope.updateGroupsList();
                                            popup.close();
                                        });
                                    });
                                }

                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){
                                popup.close();
                            }
                        }
                    ],
                    width:1200
                });
            });
        }

    })
    .controller("api",function($scope,$http,$compile){
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.page = 1;
        $scope.pages = 0;
        $scope.routers = [];
        $scope.router = {};

        $scope.getApiRouters = function(page){
            $http.get("/admin/api",{params:{"do":"getApiRouters",page:page || $scope.page}}).success(function(data){
                $scope.page = parseInt(data.routers.page);
                $scope.pages = parseInt(data.routers.pages);
                $scope.routers = data.routers.child;
                if (!data.routers.child.length && $scope.page>1){
                    $scope.getApiRouters(1);
                }
            });
        };
        $scope.getApiRouters();
        $scope.isEnabled = function (bool){
            return bool?"Активен":"Отключен";
        };
        $scope.checkAlias = function(alias,id){
            $http.get("/admin/api",{params:{do:"checkAlias",alias:alias}}).success(function(data){

            });
        };
        $scope.deleteApiRouter = function(id){
            $http.get("/admin/api",{params:{do:"deleteApiRouter",id:id}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Удаление роутера API",
                    content: {html:tpl},
                    buttons:[
                        {
                            title: "Удалить",
                            class: "btn btn-red",
                            click: function(){
                                $scope.deleteApiForm['do'] = "deleteApiRouter";
                                $http.get("/admin/api",{params:$scope.deleteApiForm}).success(function(){
                                    $scope.getApiRouters();
                                });
                                popup.close();
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){ popup.close(); }
                        }
                    ]
                });
            });
        };
        $scope.createApiRouter = function(){
            $scope.submitted = false;
            $http.get("/admin/api",{params:{"do":"createApiRouter"}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Создание роутера API",
                    content: {html:tpl},
                    buttons:[
                        {
                            title: "Создать",
                            class: "btn btn-green",
                            click: function(){
                                $scope.submitted = true;
                                $scope.$apply();
                                $scope.router.sdo = 1;
                                $scope.router.do = "createApiRouter";
                                if ($scope.apiEdit.$valid){
                                    $http.get("/admin/api",{params:$scope.router}).success(function(){
                                        $scope.getApiRouters();
                                    });
                                    popup.close();
                                }
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){
                                popup.close();
                            }
                        }
                    ]
                });
            });
        };
        $scope.editApiRouter = function(id){
            $scope.submitted = false;
            $http.get("/admin/api",{params:{do:"editApiRouter",id:id}}).success(function(data){
                var tpl = $compile(data)($scope);
                var popup = modal({
                    title: "Редактирование роутера API",
                    content: {html: tpl},
                    buttons:[
                        {
                            title: "Сохранить",
                            class: "btn btn-green",
                            click: function(){
                                $scope.submitted = true;
                                $scope.$apply();
                                $scope.router.sdo = 1;
                                $scope.router.do = "editApiRouter";
                                if ($scope.apiEdit.$valid){
                                    $http.get("/admin/api",{params:$scope.router}).success(function(){
                                        $scope.getApiRouters();
                                    });
                                    popup.close();
                                }
                            }
                        },
                        {
                            title: "Отмена",
                            class: "btn",
                            click: function(){
                                popup.close();
                            }
                        }
                    ]
                });
            });
        };
    })
    .controller("settings",function($scope,$http){
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.config = {};
        $scope.getConfig = function(){
            $http.get("/admin/settings",{params:{do:"getconfig"}}).success(function(data){
                $scope.config = data.config;
            });
        };
        $scope.getConfig();
        $scope.saveSettings = function(){
            var cfg = JSON.stringify($scope.config);
            $http.get("/admin/settings",{params:{do:"save",config:cfg}}).success(function(){
                modal({
                    title: "Сохранение настроек",
                    content:{ html: "Настройки успешно сохранены"},
                    buttons:[
                        {
                            title: "Закрыть",
                            class: "btn btn-green",
                            click: function(){ this.close(); }
                        }
                    ]
                });
                $scope.getConfig();
            });
        }
    })
    .controller("dashboard",function($scope,$http){
        $scope.submitted = false;
        $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        $scope.checkPosition = function(){
            this.submitted = true;
            var errors = Object.keys($scope.analytics.$error);
            if (!errors.length){
            }
        };
        $scope.sendEmail = function(){
            this.submittedMail = true;
            var data = {
                subject: $scope.mailsubject,
                group: $scope.mailgroup,
                message: $scope.mailmessage
            };
            var errors = Object.keys($scope.mail.$error);
            if (!errors.length){
                $http.post("/api/mail",data).success(function(data){
                    modal({
                        title: "Рассылка сообщений",
                        content: {html:data.html},
                        buttons:[
                            {
                                title: "Закрыть",
                                class: "btn btn-green",
                                click: function(){ this.close() }
                            }
                        ]
                    });
                    $scope.mailsubject = "";
                    $scope.mailmessage = "";
                });
                this.submittedMail = false;
            }
        };
    });


