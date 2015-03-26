define
(
    ["../login", "mustache"],
    function (login, mustache)
    {
        var db = "pending_things";
        var view_name = "GeneralView";
        var template =
            "<ul class='thing_form_list'>" +
                "{{#.}}" +
                    "{{#value}}" +
                        "<li>" +
                            "<div class='.container-fluid'>" +
                                "<div class='row'>" +
                                    "<h4><a href='{{info.thing.URL}}'>{{info.thing.Title}}</a></h4><div class='pull-right'>{{_id}}</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "{{info.thing.Description}}" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<h5>Attachments</h5>" +
                                    "<ul class='thing_form_list'>" +
                                        "{{#filelist}}<li>{{.}}</li>{{/filelist}}" +
                                    "</ul>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<h5>Authors</h5>" +
                                    "<ul class='thing_form_list'>" +
                                        "{{#info.thing.Authors}}<li>{{.}}</li>{{/info.thing.Authors}}" +
                                    "</ul>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<h5>Licenses</h5>" +
                                    "<ul class='thing_form_list'>" +
                                        "{{#info.thing.Licenses}}<li>{{.}}</li>{{/info.thing.Licenses}}" +
                                    "</ul>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<h5>Tags</h5>" +
                                    "<ul class='thing_form_list'>" +
                                        "{{#info.thing.Tags}}<li>{{.}}</li>{{/info.thing.Tags}}" +
                                    "</ul>" +
                                "</div>" +
//                                "<div class='row'>" +
//                                    "{{#info.thing.Thumbnail URL}}<img src='{{.}}'></img>{{/info.thing.Thumbnail URL}}" +
//                                "</div>" +
                                  "<div class='row'>" +
                                      "{{#info.thing.Thumbnails}}<img src='{{.}}'></img>{{/info.thing.Thumbnails}}" +
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
                success : function (data)
                {
                    data.rows.forEach (function (item)
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
                    var text = mustache.render (template, data.rows);
                    document.getElementById ("listing").innerHTML = text;
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };


        // make the view
        function make_view ()
        {
            var view =
            {
                "_id": "_design/" + db,
                "language": "javascript",
                "views":
                {
                    "GeneralView": // ToDo: make this a parameter somehow
                    {
                        "map": "function(doc) { if (doc.info) emit (doc._id, doc); }"
                    }
                }
            };
            $.couch.db (db).saveDoc
            (
                view,
                {
                    success: build,
                    error: function () { alert ("make view failed"); }
                }
            );
        }

        var setup_hooks =
        [
         { id: "make_view", event: "click", code: make_view, obj: this },
         { id: "render", event: "click", code: build, obj: this },
        ];
        return (
        {
            getStep : function ()
            {
               return (
                {
                    id : "transfer",
                    title : "Transfer Things",
                    template : "templates/thingimporter/transfer.mst",
                    hooks: setup_hooks
                });
            }
        });
    }
);
