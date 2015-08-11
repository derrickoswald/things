/**
 * @fileOverview Display things from various databases.
 * @name home
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache", "thingmaker/thingwizard", "login", "torrent"],
    /**
     * @summary Functions to handle the home page.
     * @name home
     * @exports home
     * @version 1.0
     */
    function (configuration, page, mustache, thingwizard, login, torrent)
    {
        var things_template =
            "<div id='count_of_things'>{{#total_rows}}{{total_rows}} documents{{/total_rows}}{{^total_rows}}no documents{{/total_rows}}</div>" +
            "<ul class='thing_property_list'>" +
                "{{#rows}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-6'>" +
                                        "<h2 class='hidden-lg'><a href='{{info.thing.url}}' target='_blank'>{{short_title}}</a></h2>" +
                                        "<h2 class='hidden-xs hidden-sm hidden-md'><a href='{{info.thing.url}}' target='_blank'>{{info.thing.title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6'>" +
                                        "<div class='pull-right'>" +
                                            "<span class='fineprint hidden-lg'><a href='{{doc_root}}{{_id}}' target='_blank'>{{short_id}}</a></span>" +
                                            "<span class='fineprint hidden-xs hidden-sm hidden-md'><a href='{{doc_root}}{{_id}}' target='_blank'>{{_id}}</a></span>" +
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
                                            "{{#filelist}}" +
                                                "<li>" +
                                                    "<a href='{{url}}' target='_blank'>{{name}}</a>" +
                                                    "{{#torrent}}" +
                                                        "<span class='view_torrent glyphicon glyphicon-eye-open marginleft' data-toggle='tooltip' data-placement='top' title='View' data-database='{{database}}' data-id='{{_id}}' data-attachment='{{url}}' data-name='{{name}}'></span>" +
                                                    "{{/torrent}}" +
                                                "</li>" +
                                            "{{/filelist}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "{{#thumbnaillist}}" +
                                        "<div class='col-xs-6 col-md-3'>" +
                                            "<a href='{{image}}' class='thumbnail' target='_blank'>" +
                                                "<img src='{{image}}' alt='{{_id}}_image_{{index}}'>" +
                                            "</a>" +
                                        "</div>" +
                                    "{{/thumbnaillist}}" +

// identical height images... but only one row
// see http://www.minimit.com/articles/solutions-tutorials/bootstrap-3-responsive-columns-of-same-height
//                                    "<div class='row-same-height'>" +
//                                        "{{#thumbnaillist}}" +
//                                        "<div class='col-xs-6 col-xs-height col-md-3'>" +
//                                            "<a href='#' class='thumbnail' target='_blank'>" +
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
//                                        "<a class='left carousel-control' href='#{{_id}}_carousel' role='button' data-slide='prev' target='_blank'>" +
//                                            "<span class='glyphicon glyphicon-chevron-left' aria-hidden='true'></span>" +
//                                            "<span class='sr-only'>Previous</span>" +
//                                        "</a>" +
//                                        "<a class='right carousel-control' href='#{{_id}}_carousel' role='button' data-slide='next' target='_blank'>" +
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
         * @function dummmy
         * @memberOf module:home
         */
        function dummmy ()
        {
        }

        /**
         * @summary Fetch the torrent file and apply the given function.
         * @description Fetch the torrent file specified by
         * the parameters in options (database, _id, name) and call
         * the success function with the result.
         * @param {object} options - values to use and callback function
         * @function view_torrent
         * @memberOf module:home
         */
        function view_torrent (options)
        {
            var url;
            var xmlhttp;

            url = configuration.getDocumentRoot () + "/" +
                options.database + "/" + options._id + "/" + options.name;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", url, true);
            xmlhttp.responseType = "arraybuffer";
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                        options.success (xmlhttp.response);
                    else
                        if (options.error)
                            options.error ();
            };
            xmlhttp.send ();
        }

        /**
         * @summary Show a torrent in a new window.
         * @description Fetch the torrent file specified by the even parameters and show it.
         * @param {object} event - the click event on the torrent
         * @function popup_torrent
         * @memberOf module:home
         */
        function popup_torrent (event)
        {
            var name = event.target.getAttribute ("data-name");
            var url = event.target.getAttribute ("data-attachment");
            var tor = window.open ("", "TorrentWindow", "menubar=yes, status=yes");
            if (null != tor)
                tor.document.getElementsByTagName ("body")[0].innerHTML = "Loading...";
            view_torrent
            (
                {
                    database: event.target.getAttribute ("data-database"),
                    _id: event.target.getAttribute ("data-id"),
                    attachment: url,
                    name: name,
                    success: function (arraybuffer)
                    {
                        var obj = torrent.ReadTorrent (arraybuffer);
                        var text = torrent.PrintTorrent (obj);
                        if (null == tor)
                            alert ("Popup blocked.\nThe first 1000 characters of the torrent file:\n\n" + text.substring (0, 1000));
                        else
                            tor.document.getElementsByTagName ("body")[0].innerHTML =
                                "<p><a href='" + url + "'>" + name + "</a></p>" +
                                "<pre style='overflow-y: auto;'>" + text + "</pre>";
                    }
                }
            );
        }

        /**
         * @summary Render the result set.
         * @description
         * @param {object} result - like from things view but has .database property added (name of the database it came from)
         * @param {string} html_id - the DOM element to add to (you need to clear this before calling draw)
         * @param {Object} options options to apply to the view (doc={database: duh, id: something, _rev: whatever}):
         *   select: function (array_of_doc) function to handle selection of the documents
         *   edit: function (array_of_doc) function to edit the documents
         *   del: function (array_of_doc) function to delete the documents
         *   publish: function (array_of_doc) function to publish the documents
         *   transfer: function (array_of_doc) function to transfer the documents
         * @function draw
         * @memberOf module:home
         */
        function draw (result, html_id, options)
        {
            options = options || {};
            result.doc_root = configuration.getDocumentRoot () + "/" + result.database + "/";
            result.rows.forEach
            (
                function (item)
                {
                    var thing = result.doc_root + item.id + "/";
                    item.value.filelist = [];
                    for (var property in item.value._attachments)
                        if (item.value._attachments.hasOwnProperty (property))
                            item.value.filelist.push
                            (
                                {
                                    name: property,
                                    url: (thing + encodeURIComponent (property)),
                                    torrent: (".torrent" == property.substring (property.length - ".torrent".length)) // show the eye icon
                                }
                            );
                    item.value.thumbnaillist = [];
                    if (item.value.info.thing.thumbnailURL)
                        for (var i = 0; i < item.value.info.thing.thumbnailURL.length; i++)
                        {
                            var url = item.value.info.thing.thumbnailURL[i];
                            // if it doesn't start with data: or http: or https: then prepend the thing url
                            if (!("data:" == url.substring (0, 5)) && !("http:" == url.substring (0, 5)) && !("https:" == url.substring (0, 6)))
                                url = thing + url;
                            item.value.thumbnaillist.push
                            (
                                {
                                    index: i,
                                    image: url,
                                    active: (0 == i)
                                }
                            );
                        }
                }
            );
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
            var torrent_links = element.getElementsByClassName ("view_torrent");
            for (var t = 0; t < torrent_links.length; t++)
                torrent_links[t].addEventListener ("click", popup_torrent);
        }

        /**
         * @summary Read the database:view and render the data into html_id.
         * @description Uses mustache to display the contents of the database of <em>things</em>.
         * @param {String} database name of the database to display
         * @param {String} view name of the view to fetch
         * @param {String} html_id the id of the element that should be filled with the view
         * @param {Object} options options to apply to the view (doc={database: duh, id: something, _rev: whatever}):
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
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        result.database = database;
                        document.getElementById (html_id).innerHTML = "";
                        draw (result, html_id, options);
                    },
                    error : function (status)
                    {
                        if (401 == status)
                            document.getElementById (html_id).innerHTML = "<h1>Unathorized.</h1><p>Login to view this database.</p>";
                    },
                    reduce : false
                }
            );
        };

        /**
         * @summary Delete the given ids (SHA1 hash values) from the database.
         * @description Calls removeDoc for each id.
         * @param {array} ids the array of id values to delete.
         * @function delete_document
         * @memberOf module:home
         */
        function delete_document (ids)
        {
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        ids.forEach
                        (
                            function (doc)
                            {
                                $.couch.db (doc.database).removeDoc ({ _id: doc._id, _rev: doc._rev },
                                {
                                    success: function (data)
                                    {
                                        console.log ("Document " + data.id + " revision: " + data.rev + " deleted.");
                                        initialize ();
                                    },
                                    error: function (status)
                                    {
                                        console.log (status);
                                    }
                                });
                            }
                        );
                    },
                    error: function (userCtx)
                    {
                        alert ("You must be logged in to delete a thing");
                    }
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
         * @function transfer_to_local
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
         * @summary Render the content of the home page.
         * @function draw_content
         * @memberOf module:home
         */
        function draw_content ()
        {
            var areas;
            var database;
            var options;


            areas = page.get_layout ();
            areas.left.innerHTML = ""; // ToDo: find a better way for wizards to clean up after themselves
            database = page.get_current ();
            options = { del: delete_document };
            if (database == configuration.getConfigurationItem ("local_database"))
                options.publish = push_to_public;
            if (database == configuration.getConfigurationItem ("pending_database"))
                options.transfer = transfer_to_local;
            build_content (database, "things", areas.content.id, options);
        }

        /**
         * @summary Render the home page.
         * @description Uses mustache to create HTML DOM elements that display the document information.
         * @function initialize
         * @memberOf module:home
         */
        function initialize ()
        {
            // layout the page
            page.layout ();
            draw_content ();
        }

        // register for change of the current database events
        page.on
        (
            "change",
            draw_content // discard event parameter
        );

        // register for login/logout events
        login.on
        (
            "login",
            function ()
            {
                // if nothing is active, then re-initialize
                var active = false;
                var list = document.getElementById ("navigator_menu").getElementsByTagName ("ul")[0].children;
                for (var i = 0; i < list.length; i++)
                    if (list[i].classList.contains ("active"))
                        active = true;
                if (!active)
                    initialize ();
            }
        );
        login.on
        (
            "logout",
            function ()
            {
                // if nothing is active, then re-initialize
                var active = false;
                var list = document.getElementById ("navigator_menu").getElementsByTagName ("ul")[0].children;
                for (var i = 0; i < list.length; i++)
                    if (list[i].classList.contains ("active"))
                        active = true;
                if (!active)
                    initialize ();
            }
        );

        return (
            {
                initialize: initialize,
                draw: draw,
                build_content: build_content,
                delete_document: delete_document,
                push_to_public: push_to_public,
                transfer_to_local: transfer_to_local
            }
        );
    }
);
