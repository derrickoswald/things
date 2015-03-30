define
(
    ["mustache", "thingmaker/publish"],
    function (mustache, publish)
    {
        var current = "things"; // current database

        var template =
            "<ul class='thing_property_list'>" +
                "{{#.}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-12 col-sm-6 col-md-8'>" +
                                        "<h2><a href='{{info.thing.url}}'>{{info.thing.title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6 col-md-4'>" +
                                        "<span class='fineprint'>{{_id}}</span>" +
                                        "<input class='select_id pull-right' type='checkbox' data-id='{{_id}}' checked>" +
                                    "</div>" +
                                "</div>" +
                                "<div>" +
                                    "{{info.thing.description}}" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Authors</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.authors}}<li>{{.}}</li>{{/info.thing.authors}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Licenses</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.licenses}}<li>{{.}}</li>{{/info.thing.licenses}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Tags</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.tags}}<li>{{.}}</li>{{/info.thing.tags}}" +
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
                                    "{{#info.thing.thumbnails}}" +
                                    "<div class='col-xs-6 col-md-3'>" +
                                        "<a href='#' class='thumbnail'>" +
                                            "<img src='{{.}}'></img>" +
                                        "</a>" +
                                    "</div>" +
                                    "{{/info.thing.thumbnails}}" +
                                "</div>" +
                            "</div>" +
                        "</li>" +
                    "{{/value}}" +
                "{{/.}}" +
            "</ul>";

        /**
         * @summary Read the database:view of count information and render the data into html_id.
         * @description Uses mustache to display the number of documents in the database of <em>things</em>.
         * @function count
         * @memberOf module:home
         */
        function count (database, view, html_id)
        {
            $.couch.db (database).view (database + "/" + view,
            {
                success : function (result)
                {
                    var message = (0 != result.rows.length) ? "" + result.rows[0].value + " documents" : "no documents";
                    document.getElementById (html_id).innerHTML = message;
                },
                error : function (status)
                {
                    console.log (status);
                }
            });
        };

        /**
         * @summary Read the database:view and render the data into html_id.
         * @description Uses mustache to display the contents of the database of <em>things</em>.
         * @function build
         * @memberOf module:home
         */
        function build (database, view, html_id)
        {
            $.couch.db (database).view (database + "/" + view,
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
                    document.getElementById (html_id).innerHTML = mustache.render (template, result.rows);
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };

        /**
         * Return the standard layout for the main page.
         * @return An object containing { left, middle, right } elements for
         * the left quarter, middle half and right quarter respectively.
         * @function layout
         * @memberOf module:home
         */
        function layout ()
        {
            var main;
            var left;
            var content;
            var right;

            var template =
                "<div id='main_area' class='row'>" +
                    "<div class='col-md-3' id='left'>" +
                    "</div>" +
                    "<div class='col-md-6 tab-content' id='content'>" +
                    "</div>" +
                    "<div class='col-md-3' id='right'>" +
                    "</div>" +
                "</div>";

            main = document.getElementById ("main");
            main.innerHTML = mustache.render (template);

            left = document.getElementById ("left");
            content = document.getElementById ("content");
            right = document.getElementById ("right");

            return ({ left: left, content: content, right: right });
        }

        function switch_database (event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            var li = event.target.parentElement;
            current = li.getAttribute ("data-target");
            draw ();
        }

        function draw ()
        {
            var middle_template =
                "<button id='create'>Create public_things</button>" +
                "<button id='publish'>Publish</button>" +
                "<div id='count_of_things'></div>" +
                "<div id='list_of_things'></div>";
            var right_template =
                "<div id='databases'>" +
                    "<ul class='database_list'>" +
                        "{{#.}}" +
                            "<li class='database_item{{#current}} current{{/current}}' data-target={{database}}>" +
                                "<a href={{database}}>{{database}}</a>" +
                            "</li>" +
                        "{{/.}}" +
                    "</ul>" +
                "</div>" +
                "<div id='info'></div>";
            var areas = layout ();
            areas.content.innerHTML = mustache.render (middle_template);
            document.getElementById ("create").onclick = make_public;
            document.getElementById ("publish").onclick = push_to_public;
            count (current, "Count", "count_of_things");
            build (current, "Things", "list_of_things");
            $.couch.allDbs
            (
                {
                    success: function (data)
                    {
                        var dbs = [];
                        data.forEach
                        (
                            function (item)
                            {
                                if (!("_" == item.charAt (0)))
                                {
                                    var link = {database: item};
                                    if (item == current)
                                        link.current = true;
                                    dbs.push (link);
                                }
                            }
                        );
                        areas.right.innerHTML = mustache.render (right_template, dbs);
                        // hook up database switch actions
                        $ (".database_item a").on ("click", switch_database);
                    }
                }
            );
        }

        // make the view
        function make_view ()
        {
            // todo: get "public_things" database name from configuration
            make_views ("public_things", { success: function () { alert ("public_things database created"); }, error: function () { alert ("make view failed"); } });
        }

        function make_public ()
        {
            // todo: get "public_things" database name from configuration
            make_database ("public_things", { success: make_view, error: function () { alert ("database creation failed"); } })
        }

        function push_to_public ()
        {
            var list = [];
            $ (".select_id").each (function (n, item) { if (item.checked) list.push (item.getAttribute ("data-id")) });
            console.log ("publishing " + JSON.stringify (list));
            for (var i = 0; i < list.length; i++)
                publish.push (list[i]);
        }

        function make_views (dbname, options)
        {
            var view =
            {
                _id: "_design/" + dbname,
                language: "javascript",
                views: {
                    // view to count "things" (that have an info section) in the database
                    Count:
                    {
                        map: "function(doc) { emit (doc._id, 1); }",
                        reduce: "function (keys, values) { return (sum (values)); }"
                    },
                    // view of only "things" (that have an info section) in the database
                    Things:
                    {
                        map: "function(doc) { if (doc.info) emit (doc._id, doc); }"
                    }
                }
            };
            $.couch.db (dbname).saveDoc
            (
                view,
                options
            );
        }

        function make_database (dbname, options)
        {
            $.couch.db (dbname).create (options);
        }

        return (
            {
                initialize: draw,
                layout: layout,
                build: build,
                make_views: make_views,
                make_database: make_database
            }
        );
    }
);
