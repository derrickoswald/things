/**
 * @fileOverview Display things from various databases.
 * @name home
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache", "thingmaker/thingwizard", "login"],
    /**
     * @summary Functions to handle the home page.
     * @name home
     * @exports home
     * @version 1.0
     */
    function (configuration, page, mustache, thingwizard, login)
    {
        var databases = null; // list of databases

        var things_template =
            "<div id='count_of_things'>{{#total_rows}}{{total_rows}} documents{{/total_rows}}{{^total_rows}}no documents{{/total_rows}}</div>" +
            "<ul class='thing_property_list'>" +
                "{{#rows}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-6'>" +
                                        "<h2 class='hidden-lg'><a href='{{info.thing.url}}'>{{short_title}}</a></h2>" +
                                        "<h2 class='hidden-xs hidden-sm hidden-md'><a href='{{info.thing.url}}'>{{info.thing.title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6'>" +
                                        "<div class='pull-right'>" +
                                            "<span class='fineprint hidden-lg'><a href='/_utils/document.html?{{database}}/{{_id}}'>{{short_id}}</a></span>" +
                                            "<span class='fineprint hidden-xs hidden-sm hidden-md'><a href='/_utils/document.html?{{database}}/{{_id}}'>{{_id}}</a></span>" +
                                            "{{#options.edit}}" +
                                                "<span class='edit_id glyphicon glyphicon-pencil marginleft' data-toggle='tooltip' data-placement='top' title='Edit' data-database='{{database}}' data-id='{{_id}}' data-rev='{{_rev}}'>" +
                                                "</span>" +
                                            "{{/options.edit}}" +
                                            "{{#options.del}}" +
                                                "<span class='delete_id glyphicon glyphicon-trash marginleft' data-toggle='tooltip' data-placement='top' title='Delete' data-database='{{database}}' data-id='{{_id}}' data-rev='{{_rev}}'>" +
                                                "</span>" +
                                            "{{/options.del}}" +
                                            "{{#options.publish}}" +
                                                "<span class='publish_id glyphicon glyphicon-book marginleft' data-toggle='tooltip' data-placement='top' title='Publish' data-database='{{database}}' data-id='{{_id}}' data-rev='{{_rev}}'>" +
                                                "</span>" +
                                            "{{/options.publish}}" +
                                            "{{#options.transfer}}" +
                                                "<span class='transfer_id glyphicon glyphicon-share-alt marginleft' data-toggle='tooltip' data-placement='top' title='Transfer' data-database='{{database}}' data-id='{{_id}}' data-rev='{{_rev}}'>" +
                                                "</span>" +
                                            "{{/options.transfer}}" +
                                            "{{#options.select}}" +
                                                "<input class='select_id marginleft' type='checkbox' data-database='{{database}}' data-id='{{_id}}' data-rev='{{_rev}}' checked>" +
                                            "{{/options.select}}" +
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-12'>" +
                                        "{{info.thing.description}}" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-6'>" +
                                        "<h5>Authors</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.authors}}<li>{{.}}</li>{{/info.thing.authors}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-xs-6'>" +
                                        "<h5>Licenses</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.licenses}}<li>{{.}}</li>{{/info.thing.licenses}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-6'>" +
                                        "<h5>Tags</h5>" +
                                        "<ul class='thing_property_list tags'>" +
                                            "{{#info.thing.tags}}<li>{{.}}</li>{{/info.thing.tags}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-xs-6'>" +
                                        "<h5>Attachments</h5>" +
                                        "<ul class='thing_property_list attachment'>" +
                                            "{{#filelist}}<li><a href='{{url}}'>{{name}}</a></li>{{/filelist}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "{{#thumbnaillist}}" +
                                        "<div class='col-xs-6 col-md-3'>" +
                                            "<a href='#' class='thumbnail'>" +
                                                "<img src='{{image}}' alt='{{_id}}_image_{{index}}'>" +
                                            "</a>" +
                                        "</div>" +
                                    "{{/thumbnaillist}}" +

// identical height images... but only one row
// see http://www.minimit.com/articles/solutions-tutorials/bootstrap-3-responsive-columns-of-same-height
//                                    "<div class='row-same-height'>" +
//                                        "{{#thumbnaillist}}" +
//                                        "<div class='col-xs-6 col-xs-height col-md-3'>" +
//                                            "<a href='#' class='thumbnail'>" +
//                                                "<img src='{{image}}' alt='{{_id}}_image_{{index}}'>" +
//                                            "</a>" +
//                                        "</div>" +
//                                        "{{/thumbnaillist}}" +
//                                    "</div>" +

// carousel that doesn't really work well with different sized images
//                                    "<div id='{{_id}}_carousel' class='carousel slide col-xs-12 col-md-12' data-ride='carousel'>" +
//                                        "<ol class='carousel-indicators'>" +
//                                            "{{#thumbnaillist}}" +
//                                                "<li data-target='#{{_id}}_carousel' data-slide-to='{{index}}'{{#active}} class='active'{{/active}}></li>" +
//                                            "{{/thumbnaillist}}" +
//                                        "</ol>" +
//                                        "<div class='carousel-inner' role='listbox'>" +
//                                            "{{#thumbnaillist}}" +
//                                                "<div class='item{{#active}} active{{/active}}'>" +
//                                                    "<img src='{{image}}' alt='{{_id}}_image_{{index}}'>" +
//                                                "</div>" +
//                                            "{{/thumbnaillist}}" +
//                                        "</div>" +
//                                        "<a class='left carousel-control' href='#{{_id}}_carousel' role='button' data-slide='prev'>" +
//                                            "<span class='glyphicon glyphicon-chevron-left' aria-hidden='true'></span>" +
//                                            "<span class='sr-only'>Previous</span>" +
//                                        "</a>" +
//                                        "<a class='right carousel-control' href='#{{_id}}_carousel' role='button' data-slide='next'>" +
//                                            "<span class='glyphicon glyphicon-chevron-right' aria-hidden='true'></span>" +
//                                            "<span class='sr-only'>Next</span>" +
//                                         "</a>" +
//                                    "</div>" +


                                "</div>" +
                            "</div>" +
                        "</li>" +
                    "{{/value}}" +
                "{{/rows}}" +
            "</ul>";

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
         * @description Return the short form of an _id.
         * @summary Runs in the context of 'this' being a document in mustache template processing to make
         * a shorter version of the id for small devices.
         * @return A shortened form of a 40 character _id (SHA-1 hash).
         * @function short_id
         * @memberOf module:home
         */
        function short_id ()
        {
            var ret;

            ret = this._id.substring (0, 4) + ".." + this._id.substring (this._id.length - 2, this._id.length);

            return (ret);
        }

        /**
         * @summary Return the short form of a title.
         * @description Runs in the context of 'this' being a document in mustache template processing to make
         * a shortened title for small devices.
         * @return A shortened form of the title - first and last words.
         * @function short_title
         * @memberOf module:home
         */
        function short_title ()
        {
            var parts;
            var ret;

            ret = this.info.thing.title;
            if (ret && ret.length > 10)
            {
                parts = ret.split (" ");
                if (parts.length == 1) // no spaces
                    ret = ret.substring (0, 4) + ".." + ret.substring (ret.length - 2, ret.length);
                else
                    ret = parts[0] + " .. " + parts[parts.length - 1];
            }

            return (ret);
        }

        /**
         * Just here because the outline in eclipse is stupid
         * @function crap
         * @memberOf module:home
         */
        function dummmy ()
        {
        }

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
         * @function build_content
         * @memberOf module:home
         */
        function build_content (database, view, html_id, options)
        {
            $.couch.db (database).view (database + "/" + view,
            {
                success : function (result)
                {
                    options = options || {};
                    var prefix = configuration.getDocumentRoot () + "/" + database + "/";
                    result.rows.forEach (function (item)
                    {
                        var list = [];
                        for (var property in item.value._attachments)
                            if (item.value._attachments.hasOwnProperty (property))
                                list.push ({name: property, url: (prefix + item.id + "/" + encodeURIComponent (property))});
                        item.value.filelist = list;
                        list = [];
                        if (item.value.info.thing.thumbnails)
                            for (var i = 0; i < item.value.info.thing.thumbnails.length; i++)
                                list.push ({index: i, image: item.value.info.thing.thumbnails[i], active: (0 == i)});
                        item.value.thumbnaillist = list;
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
                    result.short_id = short_id;
                    result.short_title = short_title;
                    var element = document.getElementById (html_id);
                    element.innerHTML = mustache.render (things_template, result);
                    // activate tooltips
                    $("[data-toggle='tooltip']", element).tooltip ();
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
                    if (401 == status)
                        document.getElementById (html_id).innerHTML = "<h1>Unathorized.</h1><p>Login to view this database.</p>";
                },
                reduce : false
            });
        };

        /**
         * @summary Get the changes for all databases.
         * @description Uses the CouchDB _changes API to get the changes since the last time the database was queried.
         * @param {String} html_id the id of the element with datbase names to badge
         * @function changes
         * @memberOf module:home
         */
        function changes (html_id)
        {
            databases.forEach
            (
                function (db)
                {
                    var url;
                    var xmlhttp;
                    var updates;

                    url = configuration.getDocumentRoot () + "/" + db.database + "/_changes";
                    db.last = configuration.loadProperty (db.database + ".last");
                    if (null != db.last)
                        url += "?since=" + db.last;
                    xmlhttp = new XMLHttpRequest ();
                    xmlhttp.open ("GET", url, true);
                    xmlhttp.setRequestHeader ("Content-Type", "application/json");
                    xmlhttp.setRequestHeader ("Accept", "application/json");
                    xmlhttp.onreadystatechange = function ()
                    {
                        if (4 == xmlhttp.readyState)
                            if (200 == xmlhttp.status)
                            {
                                var reply = JSON.parse (xmlhttp.responseText);
//                                {
//                                    "results":
//                                    [
//                                        {"seq":34,"id":"ping","changes":[{"rev":"15-51ac2602644ebc0be38ef4b157c090af"}]},
//                                        {"seq":35,"id":"7622c4be1716f2e7f4a67621d074481557b52632","changes":[{"rev":"1-a3bd224fae0f545f8c9f7fbbe12da07d"}]}
//                                    ],
//                                    "last_seq":35
//                                }
                                if (null == db.last)
                                    configuration.storeProperty (db.database + ".last", reply.last_seq);
                                else if (db.last != reply.last_seq)
                                {
                                    db.last_seq = reply.last_seq;
                                    // count the inserts/updates to real documents
                                    updates = 0;
                                    reply.results.forEach
                                    (
                                        function (item)
                                        {
                                            if (/^(?:[0-9A-F]{40})$/i.test (item.id)) // id is 40 hex characters
                                                if (!item.deleted)
                                                    updates++;
                                        }
                                    );
                                    if (0 == updates) // no substantive changes
                                        configuration.storeProperty (db.database + ".last", reply.last_seq);
                                    else
                                    {
                                        var items = document.getElementById (html_id).getElementsByTagName ("li");
                                        for (var i = 0; i < items.length; i++)
                                        {
                                            var target = items[i].getAttribute ("data-target");
                                            if (target && (target == db.database))
                                            {
                                                // <span class="badge">42</span>
                                                var badge = document.createElement ("span");
                                                badge.setAttribute ("class", "badge");
                                                badge.innerHTML = String (updates);
                                                items[i].appendChild (badge);
                                            }
                                        }
                                    }
                                }
                            }
                    };
                    xmlhttp.send ();
                }
            );
        }

        /**
         * @summary Right hand side index builder.
         * @description Build the DOM for the database list and chooser list.
         * @param {string} html_id the id of the element to fill
         * @function build_index
         * @memberOf module:home
         */
        function build_index (html_id)
        {
            var right;
            var links;

            // fill the DOM
            right = document.getElementById (html_id);
            right.innerHTML = mustache.render (right_template, databases);

            // hook up database switch actions
            links = right.getElementsByTagName ("a");
            for (var i = 0; i < links.length; i++)
                links[i].addEventListener ("click", switch_database);

            // check for changes
            changes (html_id, databases);
        }

        /**
         * @summary Get the list of databases.
         * @description Get all databases and filter out non-thing databases.
         * @param {object} options - options for result handling
         * @function fetch_databases
         * @memberOf module:home
         */
        function fetch_databases (options)
        {
            var initial = configuration.getConfigurationItem ("public_database"); // initial database
            $.couch.allDbs
            (
                {
                    success: function (data)
                    {
                        databases = [];
                        data.forEach
                        (
                            function (item)
                            {
                                if (!("_" == item.charAt (0))
                                    && ("things" != item)
                                    && ("configuration" != item)
                                    && (configuration.getConfigurationItem ("tracker_database") != item))
                                {
                                    var link = { database: item };
                                    if (item == initial)
                                        link.current = true;
                                    databases.push (link);
                                }
                            }
                        );
                        if (options.success)
                            options.success (databases);
                    },
                    error: function ()
                    {
                        if (options.error)
                            options.error ();
                    }
                }
            );
        }

        /**
         * @summary Display another database.
         * @description Based on the event target, switch the displayed database.
         * @param {Object} event - the event that causes the switch
         * @function switch_database
         * @memberOf module:home
         */
        function switch_database (event)
        {
            event.stopPropagation ();
            event.preventDefault ();

            var next = event.target.parentElement.getAttribute ("data-target");
            set_current (next);
            initialize ();
        }

        /**
         * @summary Delete the given ids (SHA1 hash values) from the database.
         * @description Calls removeDoc for each id.
         * @param {array} ids the array of id values to delete.
         * @function delete_document
         * @memberOf module:home
         */
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
                             initialize ();
                        },
                        error: function (status)
                        {
                            console.log (status);
                        }
                    });
                }
            );
        }

        /**
         * @summary Replicate the given documents to the public database.
         * @function push_to_public
         * @memberOf module:home
         */
        function push_to_public (docs)
        {
            if (docs.length != 1)
                alert ("sorry, currently only one document can be published at a time");
            thingwizard.data.torrent = { _id: docs[0]._id }; // fake torrent... publish only needs the id
            thingwizard.initialize (6); // publish is the seventh step
        }

        /**
         * @summary Transfer the given documents to the local database.
         * @description Uses CouchDB replication to replicate the documents
         * given by docs from the pending database into the local database.
         * @param {array} docs list of document SHA1 hash codes as strings
         * @function transfer
         * @memberOf module:home
         * @return <em>nothing</em>
         */
        function transfer_to_local (docs)
        {
            var db;
            var list = [];
            docs.forEach (function (item) { list.push (item._id); db = item.database; });
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        $.couch.replicate
                        (
                            db,
                            configuration.getConfigurationItem ("local_database"),
                            {
                                success: function (data)
                                {
                                    console.log (data);
                                    delete_document (docs);
                                },
                                error: function (status) { console.log (status); }
                            },
                            {
                                create_target: false,
                                doc_ids: list
                            }
                        );
                    },
                    error: function (userCtx)
                    {
                        alert ("You must be logged in to transfer a thing");
                    }
                }
            );
        }

        /**
         * @summary Get the current database.
         * @return {string} the name of the current database
         * @function get_current
         * @memberOf module:home
         */
        function get_current ()
        {
            var ret;

            ret = null;
            databases.forEach
            (
                function (item)
                {
                    if (item.current)
                        ret = item.database;
                }
            );

            return (ret);
        }

        /**
         * @summary Set the current database.
         * @param {string} the name of the to-be current database
         * @function set_current
         * @memberOf module:home
         */
        function set_current (database)
        {
            if (null != databases)
                databases.forEach
                (
                    function (item)
                    {
                        delete item.current;
                        if (item.database == database)
                        {
                            item.current = true;
                            if (item.last_seq)
                                configuration.storeProperty (database + ".last", item.last_seq);
                        }
                    }
                );
            else
                fetch_databases ({ success: function () { set_current (database); } });
        }

        /**
         * @summary Render the parts of the home page.
         * @function render
         * @memberOf module:home
         */
        function render ()
        {
            var areas;
            var database;
            var options;

            // layout the page
            areas = page.layout ();
            build_index (areas.right.id);
            database = get_current ();
            options = { del: delete_document };
            if (database == configuration.getConfigurationItem ("local_database"))
                options.publish = push_to_public;
            if (database == configuration.getConfigurationItem ("pending_database"))
                options.transfer = transfer_to_local;
            build_content (database, "Things", areas.content.id, options);
        }

        /**
         * @summary Render the home page.
         * @description Uses mustache to create HTML DOM elements that display the document information.
         * @function initialize
         * @memberOf module:home
         */
        function initialize ()
        {
            // get the databases
            if (null == databases)
                fetch_databases ({ success: render });
            else
                render ();
        }

        return (
            {
                initialize: initialize,
                build_content: build_content,
                build_index: build_index,
                get_current: get_current,
                set_current: set_current,
                delete_document: delete_document,
                push_to_public: push_to_public,
                transfer_to_local: transfer_to_local
            }
        );
    }
);
