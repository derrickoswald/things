define
(
    ["configuration", "page", "mustache", "thingmaker/publish"],
    function (configuration, page, mustache, publish)
    {
        var current = configuration.getConfigurationItem ("local_database"); // current database

        var things_template =
            "<div id='count_of_things'>{{#total_rows}}{{total_rows}} documents{{/total_rows}}{{^total_rows}}no documents{{/total_rows}}</div>" +
            "<ul class='thing_property_list'>" +
                "{{#rows}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-12 col-sm-6 col-md-6'>" +
                                        "<h2><a href='{{info.thing.url}}'>{{info.thing.title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6 col-md-6'>" +
                                        "<div class='pull-right'>" +
                                            "<span class='fineprint'><a href='/_utils/document.html?{{database}}/{{_id}}'>{{_id}}</a></span>" +
                                            "{{#options.edit}}<span class='edit_id glyphicon glyphicon-pencil marginleft' data-database={{database}} data-id='{{_id}}' data-rev={{_rev}}></span>{{/options.edit}}" +
                                            "{{#options.del}}<span class='delete_id glyphicon glyphicon-trash marginleft' data-database={{database}} data-id='{{_id}}' data-rev={{_rev}}></span>{{/options.del}}" +
                                            "{{#options.publish}}<span class='publish_id glyphicon glyphicon-book marginleft' data-database={{database}} data-id='{{_id}}' data-rev={{_rev}}></span>{{/options.publish}}" +
                                            "{{#options.transfer}}<span class='transfer_id glyphicon glyphicon-share-alt marginleft' data-database={{database}} data-id='{{_id}}' data-rev={{_rev}}></span>{{/options.transfer}}" +
                                            "{{#options.select}}<input class='select_id marginleft' type='checkbox' data-database={{database}} data-id='{{_id}}' data-rev={{_rev}} checked>{{/options.select}}" +
                                        "</div>" +
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
                                            "{{#filelist}}<li><a href='{{url}}'>{{name}}</a></li>{{/filelist}}" +
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
                "{{/rows}}" +
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
         * @param {String} database name of the database to display
         * @param {String} view name of the view to fetch
         * @param {String} html_id the id of the element that should be filled with the view
         * @param {Object} options options to apply to the view (doc={_id: something, _rev: whatever}):
         *   select: function (array_of_doc) function to handle selection of the documents
         *   edit: function (array_of_doc) function to edit the documents
         *   del: function (array_of_doc) function to delete the documents
         *   publish: function (array_of_doc) function to publish the documents
         *   transfer: function (array_of_doc) function to transfer the documents
         * @function build
         * @memberOf module:home
         */
        function build (database, view, html_id, options)
        {
            $.couch.db (database).view (database + "/" + view,
            {
                success : function (result)
                {
                    options = options || {};
                    var prefix = "/" + database + "/";
                    result.rows.forEach (function (item)
                    {
                        var list = [];
                        for (var property in item.value._attachments)
                            if (item.value._attachments.hasOwnProperty (property))
                                list.push ({name: property, url: (prefix + item.id + "/" + property)});
                        item.value.filelist = list;
                    });
                    result.database = database;
                    result.options =
                    {
                        edit: options.edit ? true : false,
                        del: options.del ? true : false,
                        publish: options.publish ? true : false,
                        transfer: options.transfer ? true : false,
                        select: options.select ? true : false,
                    };
                    document.getElementById (html_id).innerHTML = mustache.render (things_template, result);
                    // attach actions
                    if (options.edit)
                        $ (".edit_id").on ("click", function (event) { options.edit ([{ database: event.target.getAttribute ("data-database"), _id: event.target.getAttribute ("data-id"), _rev: event.target.getAttribute ("data-rev")}]); });
                    if (options.del)
                        $ (".delete_id").on ("click", function (event) { options.del ([{ database: event.target.getAttribute ("data-database"), _id: event.target.getAttribute ("data-id"), _rev: event.target.getAttribute ("data-rev")}]); });
                    if (options.publish)
                        $ (".publish_id").on ("click", function (event) { options.publish ([{ database: event.target.getAttribute ("data-database"), _id: event.target.getAttribute ("data-id"), _rev: event.target.getAttribute ("data-rev")}]); });
                    if (options.transfer)
                        $ (".transfer_id").on ("click", function (event) { options.transfer ([{ database: event.target.getAttribute ("data-database"), _id: event.target.getAttribute ("data-id"), _rev: event.target.getAttribute ("data-rev")}]); });
                    if (options.select)
                        $ (".select_id").on ("click", function (event) { options.select ([{ database: event.target.getAttribute ("data-database"), _id: event.target.getAttribute ("data-id"), _rev: event.target.getAttribute ("data-rev")}]); });
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };

        function switch_database (event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            var li = event.target.parentElement;
            current = li.getAttribute ("data-target");
            draw ();
        }

        function delete_document (ids)
        {
            ids.forEach
            (
                function (doc)
                {
                    $.couch.db (doc.database).removeDoc ({ _id: doc._id, _rev: doc._rev },
                    {
                        success: function (data)
                        {
                             console.log (data);
                             draw ();
                        },
                        error: function (status)
                        {
                            console.log (status);
                        }
                    });
                }
            );
        }

        function draw ()
        {
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
            var areas = page.layout ();
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
                                if (!("_" == item.charAt (0)) && ("configuration" != item))
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
            build (current, "Things", areas.content.id, { del: delete_document, publish: push_to_public } );
        }

        function push_to_public (docs)
        {
            var list = [docs._id];

            for (var i = 0; i < list.length; i++)
            {
                console.log ("publishing " + docs[i]._id);
                publish.push (docs[i]._id);
            }
        }

        return (
            {
                initialize: draw,
                build: build
            }
        );
    }
);
