(function () {
        // eureka获取所有节点
        var EUREKA_GET_ALL_APPS_URL = "eureka/apps";
        // eureka接口：根据instance获取instance信息
        var EUREKA_GET_INSTANCE_URL = "/eureka/apps/{app.instance}";
        // eureka接口：根据instance启用服务
        var EUREKA_UP_SERVICE_URL = "/eureka/apps/{app.instance}/status?vlaue=UP";
        // eureka接口：根据instance停止服务
        var EUREKA_DOWN_SERVICE_URL = "/eureka/apps/{app.instance}/status?value=OUT_OF_SERVICE";
        // eureka实例列表UI
        var tableTemplate = "<div class='hedy-class-serviceList-box'><table border='1' class='hedy-class-table-apps'>"
        // eureka应用信息UI
        var applicaitonTemplate = "<tr class='{trStyle}'><td colspan='3' class='hedy-class-td-padding'><div class='hedy-class-table-apps-label hedy-class-table-apps-app-name-font'>{appName}</div></td></tr>";
        // eureka实例信息UI
        var instanceTemplate = "<tr class='{trStyle}'><td class='hedy-class-td-padding'><input type='checkbox'name='hedy-name-checkbox'value='{checkedValue}'/></td><td class='hedy-class-td-padding hedy-class-table-apps-label hedy-class-table-apps-instance-font'><div id='hedy-id-div-status-{app.instance.id}'class='hedy-class-table-apps-label hedy-class-table-apps-instance-font {instanceStatusStyle}'>{instanceStatus}</div></td><td class='hedy-class-td-padding'><div id='hedy-id-div-instance-id-{app.instance.id}'class='hedy-class-table-apps-label hedy-class-table-apps-instance-font'>{instanceId}</div></td></tr>";

        // 定时任务id 用于定时刷新eureka列表信息
        var _id = 0;

        // 定时刷新eureka应用列表 3秒
        var refreshService = function () {
            _id = setInterval(function () {
                $.ajax({
                    url: EUREKA_GET_ALL_APPS_URL,
                    type: "GET",
                    success: function (data) {
                        var apps = $.xml2json(data).application;
                        if (apps == null) new Array();
                        for (i = 0; i < apps.length; i++) {
                            var app = apps[i];
                            if (app.instance instanceof Array) {
                                for (j = 0; j < app.instance.length; j++) {
                                    var instance = app.instance[j];
                                    var id = (app.name + instance.instanceId).replace(/[~'!<>@#$%^&*(){}\[\]+_=:/.\-]/g, "");
                                    var statusStyle = instance.status == "UP" ? "hedy-class-table-apps-label hedy-class-table-apps-instance-font hedy-class-table-apps-instance-status-up" : "hedy-class-table-apps-label hedy-class-table-apps-instance-font hedy-class-table-apps-instance-status-down";
                                    $("#hedy-id-div-status-" + id).attr("class", statusStyle);
                                    $("#hedy-id-div-status-" + id).html(instance.status);
                                    console.log(id + " : " + instance.status);
                                }
                            } else {
                                var instance = app.instance;
                                var id = (app.name + instance.instanceId).replace(/[~'!<>@#$%^&*(){}\[\]+_=:/.\-]/g, "");
                                var statusStyle = instance.status == "UP" ? "hedy-class-table-apps-label hedy-class-table-apps-instance-font hedy-class-table-apps-instance-status-up" : "hedy-class-table-apps-label hedy-class-table-apps-instance-font hedy-class-table-apps-instance-status-down";
                                $("#hedy-id-div-status-" + id).attr("class", statusStyle);
                                $("#hedy-id-div-status-" + id).html(instance.status);
                                console.log(id + " : " + instance.status);
                            }
                        }
                    }
                });
            }, 3000);
        }

        // 初始化服务列表
        var initServiceList = function (dialog) {
            $.ajax({
                url: EUREKA_GET_ALL_APPS_URL,
                type: "GET",
                success: function (data) {

                    // eureka如果未配置过responseBody的话会以xml形式返回
                    var apps = $.xml2json(data).application;

                    // 以防返回值为空时引起NPE
                    if (apps == null) new Array();

                    // 初始化UI
                    var table = tableTemplate;
                    for (i = 0; i < apps.length; i++) {
                        // 添加service
                        var app = apps[i];
                        var applicationStr = applicaitonTemplate;
                        var trStyle = (i % 2 > 0) ? "hedy-class-table-apps-app-name-green" : "hedy-class-table-apps-app-name-light-green";
                        table += applicationStr.replace("{trStyle}", trStyle).replace("{appName}", app.name);

                        // 添加服务的实例
                        if (app.instance instanceof Array) {
                            for (j = 0; j < app.instance.length; j++) {
                                var instance = app.instance[j];
                                var instanceStr = instanceTemplate;
                                var statusStyle = instance.status == "UP" ? "hedy-class-table-apps-instance-status-up" : "hedy-class-table-apps-instance-status-down";
                                var id = (app.name + instance.instanceId).replace(/[~'!<>@#$%^&*(){}\[\]+_=:/.\-]/g, "");
                                table += instanceStr
                                    .replace("{trStyle}", trStyle)
                                    .replace("{instanceStatusStyle}", statusStyle)
                                    .replace("{instanceStatus}", instance.status)
                                    .replace("{checkedValue}", app.name + "/" + instance.instanceId)
                                    .replace("{instanceId}", instance.instanceId)
                                    .replace(new RegExp("{app.instance.id}", "g"), id);
                            }
                        } else {
                            var instance = app.instance;
                            var id = (app.name + instance.instanceId).replace(/[~'!<>@#$%^&*(){}\[\]+_=:/.\-]/g, "");
                            var instanceStr = instanceTemplate;
                            var statusStyle = instance.status == "UP" ? "hedy-class-table-apps-instance-status-up" : "hedy-class-table-apps-instance-status-down";
                            table += instanceStr
                                .replace("{trStyle}", trStyle)
                                .replace("{instanceStatusStyle}", statusStyle)
                                .replace("{instanceStatus}", instance.status)
                                .replace("{checkedValue}", app.name + "/" + instance.instanceId)
                                .replace("{instanceId}", instance.instanceId)
                                .replace(new RegExp("{app.instance.id}", "g"), id);
                            ;
                        }
                    }

                    table += "</table></div>";
                    dialog.content(table);
                }
            });
        };

        // 停止服务
        var downService = function (instance) {
            var downServiceURL = EUREKA_DOWN_SERVICE_URL;
            $.ajax({
                url: downServiceURL.replace("{app.instance}", instance),
                type: "PUT",//POST、PUT、DELETE
                success: function () {

                }
            });
        };

        // 启用服务
        var upService = function (instance) {
            var upService = EUREKA_UP_SERVICE_URL;
            $.ajax({
                url: upService.replace("{app.instance}", instance),
                type: "DELETE",
                success: function () {

                }
            });
        };

        // 向eureka页面注入我们自己的按钮
        $(".navbar-toggle").before("<div id = 'hedy-id-button-serviceList' class = 'hedy-class-button-serviceList'>Service List</div>");

        // 添加按钮事件
        $("#hedy-id-button-serviceList").click(function () {
            var dialog = art.dialog({
                id: 'serviceList',
                title: 'Service List ( 3秒后自动刷新数据 )',
                height: '400px',
                fixed: true,
                lock: true,
                resize: false,
                esc: true,
                init: function () {
                    initServiceList(this);
                    refreshService();
                },
                close: function () {
                    console.log("close : " + _id);
                    clearInterval(_id);
                },
                button: [
                    {
                        name: '恢复服务',
                        callback: function () {
                            var arr = $("input[name='hedy-name-checkbox']:checked");
                            $.each(arr, function () {
                                upService($(this).val());
                            });
                            art.dialog({
                                content: '正在异步恢复 [ ' + arr.length + ' ] 个服务......',
                                title: '恢复服务中...( 5秒后自动关闭 )',
                                time: 5,
                                fixed: true,
                                lock: true,
                                resize: false,
                                esc: false,
                            });
                            return false;
                        }
                    },
                    {
                        name: '暂停服务',
                        callback: function () {
                            var arr = $("input[name='hedy-name-checkbox']:checked");
                            $.each(arr, function () {
                                downService($(this).val());
                            });
                            art.dialog({
                                content: '正在异步暂停 [ ' + arr.length + ' ] 个服务......',
                                title: '暂停服务中...( 5秒后自动关闭 )',
                                time: 5,
                                fixed: true,
                                lock: true,
                                resize: false,
                                esc: false,
                            });
                            return false;
                        }
                    },
                    {
                        name: '关闭',

                        focus: true
                    }
                ]
            });
        });

    }
)();






