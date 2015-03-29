define
(
    ["../login", "mustache"],
    function (login, mustache)
    {
        var db = "pending_things";
        var view_name = "GeneralView";
        var template =
            "<ul class='thing_property_list'>" +
                "{{#.}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-12 col-sm-6 col-md-8'>" +
                                        "<h2><a href='{{info.thing.URL}}'>{{info.thing.Title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6 col-md-4'>" +
                                        "<span class='fineprint'>{{_id}}</span>" +
                                        "<input class='select_id pull-right' type='checkbox' data-id='{{_id}}' checked>" +
                                    "</div>" +
                                "</div>" +
                                "<div>" +
                                    "{{info.thing.Description}}" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Authors</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Authors}}<li>{{.}}</li>{{/info.thing.Authors}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Licenses</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Licenses}}<li>{{.}}</li>{{/info.thing.Licenses}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Tags</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Tags}}<li>{{.}}</li>{{/info.thing.Tags}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Attachments</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#filelist}}<li>{{.}}</li>{{/filelist}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "{{#info.thing.Thumbnails}}" +
                                    "<div class='col-xs-6 col-md-3'>" +
                                        "<a href='#' class='thumbnail'>" +
                                            "<img src='{{.}}'></img>" +
                                        "</a>" +
                                    "</div>" +
                                    "{{/info.thing.Thumbnails}}" +
                                "</div>" +
                            "</div>" +
                        "</li>" +
                    "{{/value}}" +
                "{{/.}}" +
            "</ul>";

        /**
         * @summary Read the "General" view and render the data.
         * @description Uses mustache to display the contents of the pending_things database.
         * @function render
         * @memberOf module:transfer
         */
        function build ()
        {
            $.couch.db (db).view (db + "/" + view_name,
            {
                success : function (result)
                {
                    result.rows.forEach (function (item)
                    {
                        var list = [];
                        for (var property in item.value._attachments)
                        {
                            if (item.value._attachments.hasOwnProperty (property))
                            {
                                list.push (property);
                            }
                        }
                        item.value.filelist = list;
                    });
                    var text = mustache.render (template, result.rows);
                    document.getElementById ("listing").innerHTML = text;
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };

        function transfer ()
        {
            var list = [];
            $ (".select_id").each (function (n, item) { if (item.checked) list.push (item.getAttribute ("data-id")) });
            // ToDo: delete pending_things
            $.couch.replicate
            (
                "pending_things",
                "things",
                {
                    success: function (data) { console.log (data); },
                    error: function (status) { console.log (status); }
                },
                {
                    create_target: false,
                    doc_ids: list
                }
            );
        }

        return (
        {

            getStep : function ()
            {
                var setup_hooks =
                    [
                        { id: "transfer", event: "click", code: transfer, obj: this }
                    ];
               return (
                {
                    id : "transfer",
                    title : "Transfer Things",
                    template : "templates/thingimporter/transfer.mst",
                    hooks: setup_hooks,
                    transitions: { enter: build, obj: this }
                });
            }
        });
    }
);
