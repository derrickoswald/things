/**
 * @fileOverview View of the thing tracker network.
 * This module includes functions for handling the discover page.
 * The discover page allows the user to federate the <em>things</em>
 * instance with other <em>things</em> in the cloud -- called tracking --
 * and also make local copies of other <em>things</em> public databases
 * -- called joining -- to be able to access and search the files from the other database.
 * @name discover
 * @module discover
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache", "deluge", "login", "database"],
//    /**
//     * @summary Functions for handling the discover page.
//     * @name discover
//     * @exports discover
//     * @version 1.0
//     */
    function (configuration, page, mustache, deluge, login, database)
    {
        // logged in state
        var logged_in = false;

        /**
         * list of persistent replications
         * @memberOf module:discover
         */
        var replications = [];

        /**
         * list of localized remote databases
         * @memberOf module:discover
         */
        var databases = [];

        // mustache template for the display page
        var trackers_template =
            "<h2>Discovery</h2>" +
            "<h3>Update the global record for this <em>thing tracker</em></h3>" +
            "<p>The <em>Post my things</em> button creates or updates the record for this local tracker in the " +
            "<em>thing tracker</em> database. Normally this manual step won't be needed because the " +
            "operations of publishing a <em>thing</em> will update the thing-tracker database as well as " +
            "the <em>public things</em> database. But, in case they get out of sync somehow, you can use this button.</p>" +
            "If the <em>thing tracker</em> database is joined to other trackers (see below) then these federated trackers " +
            "will also be updated via CouchDB continuous replication (when they are available online).</p>" +
            "<div class='form-horizontal'>" +
                "<div class='form-group'>" +
                    "<label class='col-sm-3 control-label' for='post_my_things'></label>" +
                    "<div class='col-sm-9'>" +
                        "<button id='post_my_things' class='btn btn-primary'>" +
                            "<i class='glyphicon glyphicon-star marginright'></i>" +
                            "<span>Post my things</span>" +
                        "</button>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            "<h3>Start bi-directional replication with a new <em>thing tracker</em>.</h3>" +
            "<p>This is the step that bootstraps this <em>thing tracker</em> into a cloud of other similar systems.</p>" +
            "<img class='pull-right' src='img/blackboard.png' width='25%'>" +
            "<p>The <em>thing tracker</em> cloud can be thought of as an infinite blackboard where you can post " +
            "a note that tells people how to find your thing tracker.</p>" +
            "<p>By clicking the <em>Join tracker</em> button, a bi-directional non-permanent replication " +
            "is perfomed which does two things:</p>" +
            "<ul>" +
                "<li>this tracker, and other trackers in the local <em>thing tracker</em> database, " +
                "are added into the <em>thing tracker</em> database of the other system (replication from " +
                "this system to the specified remote system) - basically writing your name on that blackboard</li>" +
                "<li>any new or updated trackers in the database of the remote system are added to the local " +
                "<em>thing tracker</em> database (replication from the specified remote system to this system) " +
                "- basically copying all the names that are currently on that blackboard to your blackboard</li>" +
            "</ul>" +
            "<p>This bi-directional replication is not permanent. In order to create a " +
            "permanent join, wait until the other system is displayed in the list of trackers below (a page " +
            "refresh may be required), and then click the \"Join\" icon next to the tracker URL.</p>" +
            "<p>Due to the nature of CouchDB <em>eventual consistency</em>, joining multiple trackers (permanently) " +
            "will join their respective clouds together -- because it is a single multi-way replicated CouchDb database " +
            "there really is only one global federated database of <em>thing trackers</em>, that is, one big blackboard. " +
            "Each permanently joined <em>thing tracker</em> adds a redundant connection from this tracker to the cloud.</p>" +
            "<p>Each tracker is stored in the <em>thing tracker</em> database as a document with the same name as its uuid. " +
            "This uuid is listed under the Configuration tab under Instance UUID, and for a single user system this corresponds " +
            "to the CouchDB uuid, which can be seen in the CouchDB <b>Welcome</b> " +
            "message by navigating to the root of the CouchDB web server.</p>" +
            "<div class='form-horizontal'>" +
                "<div class='form-group'>" +
                    "<label class='col-sm-3 control-label' for='local_database'>New tracker URL</label>" +
                    "<div class='col-sm-9'>" +
                        "<input id='tracker_url' class='form-control' type='text' name='tracker_url' placeholder='http://TheTracker.org'>" +
                    "</div>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label class='col-sm-3 control-label' for='join_tracker_button'></label>" +
                    "<div class='col-sm-9'>" +
                        "<button id='join_tracker_button' class='btn btn-primary'>" +
                            "<i class='glyphicon glyphicon-plus-sign marginright'></i>" +
                            "<span>Join tracker</span>" +
                        "</button>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            "<h3>Track Others</h3>" +
            "<p>This Discovery tab also allows you to set up tracking - making copies of other trackers <em>things</em>.</p>" +
            "<p>This works by creating a local database that is a continuously replicated copy of the remote database. " +
            "By having the database locally, you can search, view and access the files of these other things, without " +
            "an internet connection. &lt;TBD&gt;Using the <b>lightweight</b> tracking option you can replicate the " +
            "metadata of the other things without replicating the associated files - which conserves disk space.&lt;/TBD&gt;</p>" +
            "<p>To begin tracking another <em>things</em> system click on the <em>Track</em> button beside its " +
            "name in the <em>Tracker List</em> below. This will set up a unidirectional CouchDB continuous replication " +
            "between the remote machine and a local database named 'z'+(uuid of the remote), and show it in the database " +
            "list (on the right or above) so you can view the contents.</p>" +
            "<p></p>" +
            "<h2>Tracker List</h2>" +
            "<div id='count_of_trackers'>{{#total_rows}}{{total_rows}} trackers{{/total_rows}}{{^total_rows}}no documents{{/total_rows}}</div>" +
            "<ul class='tracker_list'>" +
                "{{#rows}}" +
                    "{{#value}}" +
                        "<div>" +
                            "<h3>" +
                                "<a href='{{url}}' target='_blank'>{{name}}</a>" +
                                "{{{permanent_join}}}" +
                                "{{{begin_track}}}" +
                            "</h3>" +
                            "(owner: {{owner}} public_url: {{public_url}} tracker_url: {{tracker_url}} {{id}})" +
                            "<ul class='thinglist'>" +
                                "{{#things}}" +
                                "<li><a href='magnet:?xt=urn:btih:{{id}}&dn={{title}}'>{{title}}<img src='img/magnet.svg' style='width:1em; height: 1em; margin-left: 4px;' alt='magnet link'></a></li>" +
                                "{{/things}}" +
                            "</ul>" +
                        "</div>" +
                    "{{/value}}" +
                "{{/rows}}" +
            "</ul>";

        /**
         * @summary Join another tracker database - one time.
         * @description Performs a one-time replication with another database which
         * exposes the local tracker into the cloud of that tracker (from local to remote),
         * and updates the local tracker database with the contents of the remote system
         * (from remote to local).
         * @function join_tracker_once
         * @memberOf module:discover
         */
        function join_tracker_once (event)
        {
            var local_tracker_name = configuration.getConfigurationItem ("tracker_database");
            var remote_tracker_url = document.getElementById ("tracker_url").value.trim ();
            $.couch.replicate
            (
                local_tracker_name,
                remote_tracker_url,
                {
                    success: function (data)
                    {
                        console.log (data);
                        initialize ();
                    },
                    error: function (status) { console.log (status); }
                },
                {
                    create_target: false
                }
            );
            $.couch.replicate
            (
                remote_tracker_url,
                local_tracker_name,
                {
                    success: function (data)
                    {
                        console.log (data);
                        initialize ();
                    },
                    error: function (status) { console.log (status); }
                },
                {
                    create_target: false
                }
            );
        }

        /**
         * @summary Join another tracker database - continuously.
         * @description Performs a continuous replication with another database which
         * does what the one-time join does, but makes it permanent in the _replicator
         * database, which means the join survives a CouchDb restart.
         * @function join_tracker_continuous
         * @memberOf module:discover
         */
        function join_tracker_continuous (event)
        {
            if (logged_in)
            {
                var id = event.target.getAttribute ("data-id");
                var local_tracker_name = configuration.getConfigurationItem ("tracker_database");
                var remote_tracker_url = event.target.getAttribute ("data-url");
                // _replicator documents
                var from_here_to_there =
                {
                    _id: ">" + id,
                    source: local_tracker_name,
                    target: remote_tracker_url,
                    create_target: false,
                    continuous: true
                };
                var from_there_to_here =
                {
                    _id: "<" + id,
                    source: remote_tracker_url,
                    target: local_tracker_name,
                    create_target: false,
                    continuous: true
                };

                $.couch.db ("_replicator").saveDoc
                (
                    from_here_to_there,
                    {
                        success: function ()
                        {
                            $.couch.db ("_replicator").saveDoc
                            (
                                from_there_to_here,
                                {
                                    success: function ()
                                    {
                                        alert ("joined " + JSON.stringify ([from_here_to_there, from_there_to_here], null, 4));
                                        initialize ();
                                    },
                                    error: function ()
                                    {
                                        alert ("error: failed to save " + JSON.stringify (from_there_to_here, null, 4));
                                    }
                                }
                            );
                        },
                        error: function ()
                        {
                            alert ("error: failed to save " + JSON.stringify (from_here_to_there, null, 4));
                        }
                    }
                );
            }
            else
                alert ("you must be logged in to add a continuous tracker");
        }

        /**
         * @summary Stop continuous replication to another tracker database.
         * @description Deletes the _replicator documents.
         * @function unjoin_tracker_continuous
         * @memberOf module:discover
         */
        function unjoin_tracker_continuous (event)
        {
            if (logged_in)
            {
                var id = event.target.getAttribute ("data-id");
                // _replicator documents
                var from_here_to_there = ">" + id;
                var from_there_to_here = "<" + id;
                $.couch.db ("_replicator").openDoc
                (
                    from_here_to_there,
                    {
                        success: function (data)
                        {
                            $.couch.db ("_replicator").removeDoc
                            (
                                data,
                                {
                                    success: function ()
                                    {
                                        $.couch.db ("_replicator").openDoc
                                        (
                                            from_there_to_here,
                                            {
                                                success: function (data)
                                                {
                                                    $.couch.db ("_replicator").removeDoc
                                                    (
                                                        data,
                                                        {
                                                            success: function ()
                                                            {
                                                                alert ("unjoined " + from_here_to_there + " and " + from_there_to_here);
                                                                initialize ();
                                                            },
                                                            error: function (status)
                                                            {
                                                                alert ("failed to remove " + from_there_to_here);
                                                            }
                                                        }
                                                    );
                                                },
                                                error: function (status)
                                                {
                                                    alert ("failed to open " + from_there_to_here);
                                                }
                                            }
                                        );
                                    },
                                    error: function (status)
                                    {
                                        alert ("failed to remove " + from_here_to_there);
                                    }
                                }
                            );
                        },
                        error: function (status)
                        {
                            alert ("failed to open " + from_here_to_there);
                        }
                    }
                );
            }
            else
                alert ("you must be logged in to remove a continuous tracker");
        }

        /**
         * @summary Push the URL, version and SHA1 keys in the public database to the tracker database.
         * @description Updates the document about the local public database in the tracker database.
         * @function post_my_things
         * @memberOf module:discover
         */
        function post_my_things ()
        {
            var uuid = configuration.getConfigurationItem ("instance_uuid");
            var public_name = configuration.getConfigurationItem ("public_database");
            var tracker_name = configuration.getConfigurationItem ("tracker_database");
            $.couch.db (public_name).allDocs
            (
                {
                    include_docs: true,
                    success: function (data)
                    {
                        var doc = { _id: uuid };
                        doc.version = "1.0";
                        doc.url = document.location.origin + "/";
                        doc.public_url = configuration.getDocumentRoot () + "/" + public_name + "/";
                        doc.tracker_url = configuration.getDocumentRoot () + "/" + tracker_name + "/";
                        doc.name = configuration.getConfigurationItem ("instance_name");
                        doc.owner = configuration.getConfigurationItem ("keybase_username");
                        doc.things = [];
                        data.rows.forEach
                        (
                            function (item)
                            {
                                if ("_" != item.id.charAt (0))
                                {
                                    var text = item.id;
                                    if (item.doc && item.doc.info)
                                        if (item.doc.info.thing.title)
                                            text = item.doc.info.thing.title;
                                        else
                                            if (item.doc.info.name)
                                                text = item.doc.info.name;
                                    var thing =
                                    {
                                        id: item.id,
                                        title: text
                                    };
                                    doc.things.push (thing);
                                }
                            }
                        );
                        // get the current post
                        var options =
                        {
                            success: function ()
                            {
                                alert (tracker_name + " updated");
                            },
                            error: function (status)
                            {
                                alert (tracker_name + " update failed " + JSON.stringify (status, null, 4));
                            }
                        };
                        $.couch.db (tracker_name).openDoc
                        (
                            doc._id,
                            {
                                success: function (data)
                                {
                                    doc._rev = data._rev;
                                    $.couch.db (tracker_name).saveDoc
                                    (
                                        doc,
                                        options
                                    );
                                },
                                error: function (status)
                                {
                                    $.couch.db (tracker_name).saveDoc
                                    (
                                        doc,
                                        options
                                    );
                                }
                            }
                        );
                    }
                }
            );
        }

        /**
         * @summary Handle the event to begin making a tracker locally accessible.
         * @description Creates a new database named by the id of the tracker.
         * @function begin_tracking
         * @memberOf module:discover
         */
        function begin_tracking (event)
        {
            if (logged_in)
            {
                var id = event.target.getAttribute ("data-id");
                var remote_url = event.target.getAttribute ("data-url");
                id = "z" + id; // Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.

                database.make_database
                (
                    id,
                    {
                        success: function ()
                        {
                            // _replicator documents
                            var from_there_to_here =
                            {
                                _id: id,
                                source: remote_url,
                                target: id,
                                create_target: false,
                                continuous: true,
                                user_ctx:
                                {
                                    name: "admin",
                                    roles: ["_admin"]
                                }
                            };
                            $.couch.db ("_replicator").saveDoc
                            (
                                from_there_to_here,
                                {
                                    success: function ()
                                    {
                                        alert ("now tracking " + id);
                                        initialize ();
                                    },
                                    error: function ()
                                    {
                                        alert ("error: failed to save " + JSON.stringify (from_there_to_here, null, 4));
                                    }
                                }
                            );
                        },
                        error: function ()
                        {
                            alert (name + " database creation failed");
                        }
                    },
                    database.standard_views,
                    database.standard_validation,
                    database.standard_search
                );
            }
            else
                alert ("you must be logged in to track");
        }

        /**
         * @summary Handle the event to stop making a tracker locally accessible.
         * @description Stops the replication process and deletes the database.
         * @function stop_tracking
         * @memberOf module:discover
         */
        function stop_tracking (event)
        {
            if (logged_in)
            {
                var id = event.target.getAttribute ("data-id");
                id = "z" + id;
                $.couch.db ("_replicator").openDoc
                (
                    id,
                    {
                        success: function (data)
                        {
                            $.couch.db ("_replicator").removeDoc
                            (
                                data,
                                {
                                    success: function ()
                                    {
                                        database.delete_database
                                        (
                                            id,
                                            {
                                                success: function ()
                                                {
                                                    alert ("untracked " + id);
                                                    initialize ();
                                                },
                                                error: function ()
                                                {
                                                    alert ("failed to untrack " + id);
                                                    initialize ();
                                                }
                                            }
                                        );
                                    },
                                    error: function (status)
                                    {
                                        alert ("failed to remove " + id);
                                    }
                                }
                            );
                        },
                        error: function (status)
                        {
                            alert ("failed to open " + id);
                        }
                    }
                );
            }
            else
                alert ("you must be logged in to stop tracking");
        }

        /**
         * @summary Display the database with functions to post to the tracker database, etc.
         * @description Main screen for the discover page.
         * @function display
         * @memberOf module:discover
         */
        function display (database, view)
        {
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        var areas = page.layout ();
                        var lookup_replication = function (id)
                        {
                            var to;
                            var from;
                            var ret;

                            ret = false;

                            to = ">" + id;
                            from = "<" + id;
                            replications.forEach
                            (
                                function (item)
                                {
                                    if ((item.id == to) || (item.id == from))
                                        ret = true;
                                }
                            );

                            return (ret);
                        };
                        var lookup_database = function (id)
                        {
                            var ret;

                            ret = false;

                            id = "z" + id;
                            replications.forEach
                            (
                                function (item)
                                {
                                    if (item.id == id)
                                        ret = true;
                                }
                            );

                            return (ret);
                        };
                        result.begin_track = function ()
                        {
                            var text;

                            if ((document.location.origin + "/" == this.url) || !logged_in)
                                text = "";
                            else
                                if (lookup_database (this._id))
                                    text = "<span class='untrack glyphicon glyphicon-ban-circle marginleft' data-toggle='tooltip' data-placement='top' title='Stop tracking' data-url='" + this.public_url + "' data-id='" + this._id + "'></span>";
                                else
                                    text = "<span class='track glyphicon glyphicon-screenshot marginleft' data-toggle='tooltip' data-placement='top' title='Track' data-url='" + this.public_url + "' data-id='" + this._id + "'></span>";

                            return (text);
                        };
                        result.permanent_join = function ()
                        {
                            var text;

                            if ((document.location.origin + "/" == this.url) || !logged_in)
                                text = "";
                            else
                                if (lookup_replication (this._id))
                                    text = "<span class='unjoin glyphicon glyphicon-stop marginleft' data-toggle='tooltip' data-placement='top' title='Stop joining' data-url='" + this.tracker_url + "' data-id='" + this._id + "'></span>";
                                else
                                    text = "<span class='join glyphicon glyphicon-play marginleft' data-toggle='tooltip' data-placement='top' title='Join permanently' data-url='" + this.tracker_url + "' data-id='" + this._id + "'></span>";

                            return (text);
                        };
                        areas.content.innerHTML = mustache.render (trackers_template, result);
                        document.getElementById ("post_my_things").onclick = post_my_things;
                        document.getElementById ("join_tracker_button").onclick = join_tracker_once;
                        // handle the "join permanently" event
                        var joiners = areas.content.getElementsByClassName ("join");
                        for (var i = 0; i < joiners.length; i++)
                            joiners[i].addEventListener ("click", join_tracker_continuous);
                        // handle the "unjoin permanently" event
                        var unjoiners = areas.content.getElementsByClassName ("unjoin");
                        for (var i = 0; i < unjoiners.length; i++)
                            unjoiners[i].addEventListener ("click", unjoin_tracker_continuous);
                        // handle the "turn on tracking" event
                        var trackers = areas.content.getElementsByClassName ("track");
                        for (var i = 0; i < trackers.length; i++)
                            trackers[i].addEventListener ("click", begin_tracking);
                        // handle the "turn off tracking" event
                        var untrackers = areas.content.getElementsByClassName ("untrack");
                        for (var i = 0; i < untrackers.length; i++)
                            untrackers[i].addEventListener ("click", stop_tracking);
                    },
                    error : function (status)
                    {
                        console.log (status);
                    }
                }
            );
        }

        /**
         * @summary Get persistent replication tasks.
         * @description Populate the replications field with the persistent replications currently in effect.
         * @function get_replications
         * @memberOf module:discover
         */
        function get_replications (options)
        {
            replications = [];
            options = options || {};
            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        logged_in = true;
                        $.couch.db ("_replicator").allDocs // http://localhost:5984/_replicator/_all_docs
                        (
                            {
                                success: function (result)
                                {
                                    result.rows.forEach
                                    (
                                        function (row)
                                        {
                                            if ("_" != row.id.charAt (0))
                                                replications.push (row);
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
                    },
                    error: function ()
                    {
                        logged_in = false;
                        if (options.error)
                            options.error ();
                    }
                }
            );
        }

        /**
         * @summary Get the list of databases.
         * @description Get all databases and filter out known databases.
         * @param {object} options - options for result handling
         * @function get_databases
         * @memberOf module:discover
         */
        function get_databases (options)
        {
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
                                    && (configuration.getConfigurationItem ("local_database") != item)
                                    && (configuration.getConfigurationItem ("pending_database") != item)
                                    && (configuration.getConfigurationItem ("public_database") != item)
                                    && (configuration.getConfigurationItem ("tracker_database") != item))
                                {
                                    databases.push (item);
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

        // register for login/logout events
        login.on
        (
            "login",
            function ()
            {
                if (!logged_in) // could be set by auto-login
                {
                    logged_in = true;
                    // if Discover Things is the active page, re-initialize
                    if (document.getElementById ("discover_thing").parentElement.classList.contains ("active"))
                        initialize ();
                }
            }
        );
        login.on
        (
            "logout",
            function ()
            {
                logged_in = false;
                // if Discover Things is the active page, re-initialize
                if (document.getElementById ("discover_thing").parentElement.classList.contains ("active"))
                    initialize ();
            }
        );

        /**
         * @summary Initialize the discover page.
         * @description Display the discover page.
         * @function initialize
         * @memberOf module:discover
         */
        function initialize ()
        {
            // get the replications (or not), databases (or not), and then display the page
            function fn ()
            {
                display (configuration.getConfigurationItem ("tracker_database"), "trackers");
            };
            function gn ()
            {
                get_databases ({ success: fn, error: fn });
            };
            get_replications ({ success: gn, error: gn });
        }

        return (
            {
                initialize: initialize,
                post_my_things: post_my_things
            }
        );
    }
);