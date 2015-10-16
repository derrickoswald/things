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
    /**
     * @summary Functions for handling the discover page.
     * @name discover
     * @exports discover
     * @version 1.0
     */
    function (configuration, page, mustache, deluge, login, database)
    {
        // logged in state
        var logged_in = false;

        var discover_template = null;

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
                        doc.version = configuration.getVersion ();
                        doc.url = document.location.origin + "/";
                        doc.things_url = configuration.getDocumentRoot () + "/things/";
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
                id = "x" + id; // Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.

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
                    // ToDo: determine the use-case where a new design document (with name _design/x<id>) is really needed
                    // - since the cloned database already has one
                    // what would we have to change to use the cloned design document (with name _design/public_things maybe)
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
                id = "x" + id;
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
         * @param {string} database - the name of the database to use
         * @param {string} view - the name of the view to use
         * @param {string} template - the Mustache template to render with
         * @function render
         * @memberOf module:discover
         */
        function render (database, view, template)
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

                            id = "x" + id;
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
                        areas.content.innerHTML = mustache.render (template, result);
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
         * @summary Display the database with functions to post to the tracker database, etc.
         * @description Main screen for the discover page.
         * @param {string} database - the name of the database to use
         * @param {string} view - the name of the view to use
         * @function display
         * @memberOf module:discover
         */
        function display (database, view)
        {
            if (null == discover_template)
                $.get
                (
                    "templates/discover.mst",
                    function (template)
                    {
                        discover_template = template;
                        render (database, view, template);
                    }
                );
            else
                render (database, view, discover_template);
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
                    success: function (context)
                    {
                        if (-1 != context.roles.indexOf ("_admin"))
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
                        }
                        else
                        {
                            logged_in = false;
                            if (options.error)
                                options.error ();
                        }
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
            function (event, context)
            {
                if (!logged_in) // could be set by auto-login
                {
                    if (-1 != context.roles.indexOf ("_admin"))
                        logged_in = true;
                    else
                        logged_in = false;
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