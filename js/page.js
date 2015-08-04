/**
 * @fileOverview Application layout
 * @name page
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration","mustache", "login"],
    /**
     * @summary Single page application layout component.
     * @description ... will eventually be used for back button history,
     * working with pushState() and onpopstate handler with context save and restore
     * @name page
     * @exports page
     * @version 1.0
     */
    function (configuration, mustache, login)
    {
        var left;
        var content;
        var right;

        var databases = null; // list of databases

        var right_template =
            "<div id='databases'>" +
                "<ul class='database_list'>" +
                    "{{#.}}" +
                        "<li class='database_item{{#current}} current{{/current}}' data-target={{database}}>" +
                            "<a href={{database}}>{{name}}</a>" +
                        "</li>" +
                    "{{/.}}" +
                "</ul>" +
            "</div>" +
            "<div id='info'></div>";

        /**
         * @summary Return the list of databases for the current user.
         * @return {object[]} array of database objects each containing { database, name, url }
         * @function getDatabases
         * @memberOf module:page
         */
        function getDatabases ()
        {
            return (databases);
        }

// ToDo: media query based layout
//            // see http://www.sitepoint.com/javascript-media-queries/
//            // http://getbootstrap.com/css/#grid-media-queries
//            // http://stackoverflow.com/questions/18424798/twitter-bootstrap-3-how-to-use-media-queries
//            var mq;
//
//            mq = window.matchMedia ("(min-width: 1000px)");
//            if (mq.matches)
//                // window width is at least 1000px
//            else
//            {
//                // window width is less than 1000px
//            }

        /**
         * @summary Perform the standard layout for the main page.
         * @return {object} containing { left, middle, right } elements for
         * the left quarter, middle half and right quarter respectively.
         * @function layout
         * @memberOf module:page
         */
        function layout ()
        {
            var target;

            var template =
                "<div id='main_area' class='row'>" +
                    "<div class='col-sm-6 col-md-3' id='left'>" +
                    "</div>" +
                    "<div class='col-sm-6 col-md-3 col-md-push-6' id='right'>" +
                    "</div>" +
                    "<div class='col-md-6 col-md-pull-3 tab-content' id='content'>" +
                    "</div>" +
                "</div>";

            target = document.getElementById ("main");
            target.innerHTML = mustache.render (template);

            left = document.getElementById ("left");
            content = document.getElementById ("content");
            right = document.getElementById ("right");

            // get the databases
            if (null === databases)
                fetch_databases ({ success: draw });
            else
                draw ();

            return ({ left: left, content: content, right: right });
        }

        /**
         * @summary Return the layout for the main page.
         * @return {object} containing { left, middle, right } elements for
         * the left quarter, middle half and right quarter respectively.
         * @function get_layout
         * @memberOf module:page
         */
        function get_layout ()
        {
            return ({ left: left, content: content, right: right });
        }

        /**
         * @summary Get the changes for all databases.
         * @description Uses the CouchDB _changes API to get the changes since the last time the database was queried.
         * @param {String} html_id the id of the element with database names to badge
         * @function changes
         * @memberOf module:page
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
                    if (null !== db.last)
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

                                // get the element of interest
                                var element = null;
                                var items = document.getElementById (html_id).getElementsByTagName ("li");
                                for (var i = 0; (null === element) && (i < items.length); i++)
                                {
                                    var target = items[i].getAttribute ("data-target");
                                    if (target && (target == db.database))
                                        element = items[i];
                                }

                                // delete any existing badge
                                var badges = element.getElementsByClassName ("badge");
                                var l = badges.length;
                                for (var j = 0; j < l; j++)
                                    element.removeChild (badges[0]);

                                if (null === db.last)
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

                                    if (0 === updates) // no substantive changes
                                        configuration.storeProperty (db.database + ".last", reply.last_seq);
                                    else
                                    {
                                        // <span class="badge">42</span>
                                        var badge = document.createElement ("span");
                                        badge.setAttribute ("class", "badge");
                                        badge.innerHTML = String (updates);
                                        element.appendChild (badge);
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
         * @memberOf module:page
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

            // check for changes after maybe auto-login first
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        changes (html_id);
                    },
                    error: function (userCtx)
                    {
                        changes (html_id);
                    }
                }
            );
        }

        /**
         * @summary Create the known database list..
         * @description Another algorithm for database list creation, this uses the configured
         * database names and names from the trackers database that have a local copy.
         * @param {object} options - options for result handling
         * @function fetch_known_databases
         * @memberOf module:page
         */
        function fetch_known_databases (options)
        {
            $.couch.allDbs
            (
                {
                    success: function (local_databases)
                    {
                        var nam = configuration.getConfigurationItem ("instance_name");
                        var pub = configuration.getConfigurationItem ("public_database");
                        var loc = configuration.getConfigurationItem ("local_database");
                        var pen = configuration.getConfigurationItem ("pending_database");
                        databases =
                        [
                            { database: pub, name: nam, url: pub },
                            { database: loc, name: "Local", url: loc }, // ToDo: exclude local db from the list if it's secured
                            { database: pen, name: "Pending", url: pen }
                        ];
                        var url = document.location.origin + "/";
                        var self = configuration.getConfigurationItem ("instance_uuid");
                        var database = configuration.getConfigurationItem ("tracker_database");
                        var view = "Trackers";
                        $.couch.db (database).view
                        (
                            database + "/" + view,
                            {
                                success : function (result)
                                {
                                    result.rows.forEach
                                    (
                                        function (row)
                                        {
                                            if (row.id != self) // the public database is already in the list
                                            {
                                                var db;

                                                if (row.value.url == url) // local
                                                {
                                                    // reconstruct the public database name from the public URL
                                                    db = row.value.public_url;
                                                    db = db.substring (configuration.getDocumentRoot ().length + 1);
                                                    db = db.substring (0, db.length - 1);
                                                }
                                                else
                                                    // otherwise the local database name has a Z prefix (if it exists)
                                                    db = "z" + row.id;
                                                if (-1 != local_databases.indexOf (db))
                                                    databases.push
                                                    (
                                                        {
                                                            database: db,
                                                            name: row.value.name,
                                                            url: row.value.url
                                                        }
                                                    );
                                            }
                                        }
                                    );
                                    // try and set the current database to what it was
                                    var current = get_current ();
                                    var set = false;
                                    databases.forEach
                                    (
                                        function (item)
                                        {
                                            if (item.database == current)
                                            {
                                                item.current = true;
                                                set = true;
                                            }
                                        }
                                    );
                                    if (!set) // revert to public database
                                        set_current (pub);
                                    if (options.success)
                                        options.success ();
                                },
                                error: function ()
                                {
                                    if (options.error)
                                        options.error ();
                                }
                            }
                        );
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
         * @summary Get any database aliases.
         * @description Get all foreign databases and set their names in the lookup list.
         * @param {object} options - options for result handling
         * @function fetch_aliases
         * @memberOf module:page
         */
        function fetch_aliases (options)
        {
            var self = configuration.getConfigurationItem ("instance_uuid");
            var pub = configuration.getConfigurationItem ("public_database");
            var database = configuration.getConfigurationItem ("tracker_database");
            var view = "Trackers";
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        result.rows.forEach
                        (
                            function (row)
                            {
                                var localname = (self == row.value._id) ? pub : "z" + row.value._id;
                                var name = row.value.name;
                                var url = row.value.url;
                                databases.forEach
                                (
                                    function (item)
                                    {
                                        if (item.name == localname)
                                        {
                                            item.name = name;
                                            item.url = url;
                                        }
                                    }
                                );
                            }
                        );
                        if (options.success)
                            options.success ();
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
         * @summary Get all the databases.
         * @description Get all databases and filter out non-thing databases.
         * @param {object} options - options for result handling
         * @function fetch_all_databases
         * @memberOf module:page
         */
        function fetch_all_databases (options)
        {
            var initial = get_current ();
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
                                if (("_" !== item.charAt (0))
                                    && ("things" != item)
                                    && ("configuration" != item)
                                    && (configuration.getConfigurationItem ("tracker_database") != item))
                                {
                                    var link = { database: item, name: item, url: item };
                                    if (item == initial)
                                        link.current = true;
                                    databases.push (link);
                                }
                            }
                        );
                        fetch_aliases (options);
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
         * @summary Get the list of databases.
         * @description Get all databases and filter out non-thing databases.
         * @param {object} options - options for result handling
         * @function fetch_databases
         * @memberOf module:page
         */
        function fetch_databases (options)
        {
            $.couch.session
            (
                {
                    success: function (data)
                    {

                        if (-1 == data.userCtx.roles.indexOf ("_admin")) // non-admin
                            fetch_known_databases (options);
                        else
                            fetch_all_databases (options);
                    }
                }
            );
        }

        /**
         * @summary Display another database.
         * @description Based on the event target, switch the displayed database.
         * @param {Object} event - the event that causes the switch
         * @function switch_database
         * @memberOf module:page
         */
        function switch_database (event)
        {
            var active;
            var next;

            event.stopPropagation ();
            event.preventDefault ();

            // reset active navigation tab
            active = document.getElementById ("navigator_menu").getElementsByClassName ("active")[0];
            if (active)
                active.classList.remove ("active");
            // switch to chosen database
            next = event.target.parentElement.getAttribute ("data-target");
            set_current (next);
        }

        function dummy () // just here so Eclipse's brain dead outline mode works
        {
        }

        /**
         * @summary Get the current database.
         * @return {string} the name of the current database
         * @function get_current
         * @memberOf module:page
         */
        function get_current ()
        {
            var ret;

            ret = configuration.getConfigurationItem ("public_database"); // default database
            if (null !== databases)
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
         * @memberOf module:page
         */
        function set_current (database)
        {
            var list;

            if (null !== databases)
            {
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

                // update the selected item
                list = right.getElementsByClassName ("database_list")[0].children;
                for (var i = 0; i < list.length; i++)
                {
                    list[i].classList.remove ("current");
                    if (list[i].getAttribute ("data-target") == database)
                        list[i].classList.add ("current");
                }

                // check for changes
                changes (document.getElementById ("databases").parentElement.id);

                // let registered listeners know about the database change
                _page.trigger ("change");
            }
            else
                fetch_databases ({ success: function () { set_current (database); } });
        }

        /**
         * @summary Render the index (right side) of the page.
         * @function draw
         * @memberOf module:page
         */
        function draw ()
        {
            build_index (right.id);
        }

        // register for login/logout events
        login.on
        (
            "login",
            function ()
            {
                fetch_databases ({ success: draw });
            }
        );
        login.on
        (
            "logout",
            function ()
            {
                fetch_databases ({ success: draw });
            }
        );

        var _page = $.eventable
        (
            {
                getDatabases: getDatabases,
                layout: layout,
                get_layout: get_layout,
                get_current: get_current,
                set_current: set_current
            }
        );

        return (_page);
    }
);
