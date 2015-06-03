/**
 * @fileOverview Initial system configuration user interface.
 * @name configurator
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login"],
    /**
     * @summary Database setup page and functions for loading and saving configuration data.
     * @description Database setup page, functions for loading and saving
     * configuration data to the configuration database and programatic
     * access to the configuration settings.
     * @name configurator
     * @exports configurator
     * @version 1.0
     */
    function (configuration, page, mustache, login)
    {
        var template = "templates/configurator/configuration.mst";

        // current existing database list
        var databases = null;

        var standard_views =
            {
                // view to count "things" (that have an info section) in the database
                Count:
                {
                    map: "function(doc) { if (doc.info)  emit (doc._id, 1); }",
                    reduce: "function (keys, values) { return (sum (values)); }"
                },
                // view of only "things" (that have an info section) in the database
                Things:
                {
                    map: "function(doc) { if (doc.info) emit (doc._id, doc); }"
                }
            };

        var standard_validation =
            // validation function limiting create, update and delete to logged in users
            "function (newDoc, oldDoc, userCtx, secObj)" +
            "{" +
                "secObj.admins = secObj.admins || {};" +
                "secObj.admins.names = secObj.admins.names || [];" +
                "secObj.admins.roles = secObj.admins.roles || [];" +

                "var IS_DB_ADMIN = false;" +
                "if (~userCtx.roles.indexOf ('_admin'))" +
                    "IS_DB_ADMIN = true;" +
                "if (~secObj.admins.names.indexOf (userCtx.name))" +
                    "IS_DB_ADMIN = true;" +
                "for (var i = 0; i < userCtx.roles; i++)" +
                    "if (~secObj.admins.roles.indexOf (userCtx.roles[i]))" +
                        "IS_DB_ADMIN = true;" +

                "var IS_LOGGED_IN_USER = false;" +
                "if (null != userCtx.name)" +
                    "IS_LOGGED_IN_USER = true;" +

                "if (IS_DB_ADMIN || IS_LOGGED_IN_USER)" +
                    "log ('User : ' + userCtx.name + ' changing document: ' + newDoc._id);" +
                "else " +
                    "throw { 'forbidden': 'Only admins and users can alter documents' };" +
            "}";

        var tracker_views =
        {
            // view of only "trackers"
            Trackers:
            {
                map: "function(doc) { if (doc.things) emit (doc._id, doc); }"
            }
        };

        var read_restricted =
        // security document limiting CRUD to the admin user
        {
            "admins":
            {
                "names":
                [
                    "admin"
                ],
                "roles":
                [
                    "_admin"
                ]
            },
            "members":
            {
                "names":
                [
                    "admin"
                ],
                "roles":
                [
                    "_admin"
                ]
            }
        };

        /**
         * @summary Check if a database is secure.
         * @description Reads the _security document of a database and compares to empty array.
         * @param {string} name - the name of the database to check for security
         * @param {object} options - callback functions for the result, success: fn (boolean) and error: fn ()
         * @function is_secure
         * @memberOf module:configurator
         */
        function is_secure (name, options)
        {
            options = options || {};
            $.couch.db (name).openDoc
            (
                "_security",
                {
                    success: function (doc)
                    {
                        if (options.success)
                            if (doc)
                                options.success (("undefined" != typeof (doc.admins)) && (doc.admins.names.length != 0));
                            else
                                options.success (false);
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Make the local database secure by adding the _security document.
         * @description Stores a security policy that only allows an admin to
         * read and write the database.
         * @param {string} name - the name of the database to secure
         * @param {object} security - the security document
         * @function make_secure
         * @memberOf module:configurator
         */
        function make_secure (name, security)
        {
            security._id = "_security";
            $.couch.db (name).saveDoc
            (
                security,
                {
                    success: function ()
                    {
                        update_database_state ();
                    },
                    error: function ()
                    {
                        alert (name + " _security creation failed");
                    }
                }
            );
        }

        /**
         * @summary Remove the contents of the _security document from the local database.
         * @description Sets the security policy back to empty arrays
         *  - making the database insecure.
         * @param {string} name - the name of the database to make insecure
         * @function make_insecure
         * @memberOf module:configurator
         */
        function make_insecure (name)
        {
            $.couch.db (name).openDoc
            (
                "_security",
                {
                    success: function (doc)
                    {
                        doc.admins =
                        {
                            names: [],
                            roles: []
                        };
                        doc. members =
                        {
                            names: [],
                            roles: []
                        };

                        $.couch.db (name).saveDoc
                        (
                            doc,
                            {
                                success: function ()
                                {
                                    update_database_state ();
                                },
                                error: function (status)
                                {
                                    alert (name + " _security deletion failed " + JSON.stringify (status, null, 4));
                                }
                            }
                        );
                    },
                    error: function (status)
                    {
                        alert (name + " _security fetch failed " + JSON.stringify (status, null, 4));
                    }
                }
            );

        }

        /**
         * @summary Creates the design document.
         * @description Creates the design document in the given database
         * with standard views and logged-in security.
         * @param {string} dbname - the name of the database to create the design document in
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @function make_designdoc
         * @memberOf module:configurator
         */
        function make_designdoc (dbname, options, views, validation)
        {
            var doc =
            {
                _id: "_design/" + dbname,
            };
            if (views)
               doc.views = views;

            if (validation)
                doc.validate_doc_update = validation;
            $.couch.db (dbname).saveDoc
            (
                doc,
                options
            );
        }

        /**
         * @summary Creates a database.
         * @description Creates the given database and optionally
         * adds standard views and logged-in security.
         * @param {string} dbname - the name of the database to create
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @function make_database
         * @memberOf module:configurator
         */
        function make_database (dbname, options, views, validation)
        {
            var original_fn;

            options = options || {};
            original_fn = options.success;
            if (views || validation)
                options.success = function ()
                {
                    if (original_fn)
                        options.success = original_fn;
                    else
                        delete options.success;
                    make_designdoc (dbname, options, views, validation);
                    databases = null;
                    update_database_state ();
                };
            $.couch.db (dbname).create (options);
        }

        /**
         * @summary Creates a database.
         * @description Creates the configured database and optionally
         * adds standard views and logged-in security.
         * Used as a generic function by the database creation handlers.
         * @param {string} config_id - the configuration key value with the database name.
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @param {boolean} security - <em>optional</em> security document to attach to the database
         * @function create_database
         * @memberOf module:configurator
         */
        function create_database (config_id, views, validation, security)
        {
            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        var name = configuration.getConfigurationItem (config_id);
                        make_database
                        (
                            name,
                            {
                                success: function ()
                                {
                                    if (security)
                                        make_secure (name, security);
                                },
                                error: function ()
                                {
                                    alert (name + " database creation failed");
                                }
                            },
                            views,
                            validation
                        );
                    },
                    error: function ()
                    {
                        alert ("You must be logged in to create a database.");
                    }
                }
            );
        }

        function create_local ()   { create_database ("local_database",   standard_views, standard_validation); };
        function create_secure_local ()   { create_database ("local_database",   standard_views, standard_validation, read_restricted ); };
        function create_pending () { create_database ("pending_database", standard_views); };
        function create_public ()  { create_database ("public_database",  standard_views, standard_validation); };
        function create_tracker () { create_database ("tracker_database", tracker_views); };

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator
         */
        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            var cb = {};
            cb.success = function (data)
            {
                var db;
                var secure;

                alert ("Configuration saved.");

                db = configuration.getConfigurationItem ("local_database");
                secure = document.getElementById ("local_database_secure").checked;
                if ("" != db)
                {
                    if (-1 == databases.indexOf (db))
                        if (secure)
                            create_secure_local ();
                        else
                            create_local ();
                    else
                        // no name change, change in security only ?
                        is_secure
                        (
                            configuration.getConfigurationItem ("local_database"),
                            {
                                success: function (currently_secure)
                                {
                                    if (currently_secure && !secure)
                                        make_insecure (configuration.getConfigurationItem ("local_database"));
                                    else if (!currently_secure && secure)
                                        make_secure (configuration.getConfigurationItem ("local_database"), read_restricted);
                                }
                            }
                        );
                }

                db = configuration.getConfigurationItem ("pending_database");
                if (("" != db) && (-1 == databases.indexOf (db)))
                    create_pending ();
                db = configuration.getConfigurationItem ("public_database");
                if (("" != db) && (-1 == databases.indexOf (db)))
                    create_public ();
                db = configuration.getConfigurationItem ("tracker_database");
                if (("" != db) && (-1 == databases.indexOf (db)))
                    create_tracker ();

            };
            cb.error = function (status) { console.log (status); alert ("Configuration save failed."); };

            configuration.setConfigurationItem ("local_database", document.getElementById ("local_database").value.trim ());
            configuration.setConfigurationItem ("pending_database", document.getElementById ("pending_database").value.trim ());
            configuration.setConfigurationItem ("public_database", document.getElementById ("public_database").value.trim ());
            configuration.setConfigurationItem ("tracker_database", document.getElementById ("tracker_database").value.trim ());
            configuration.setConfigurationItem ("torrent_directory", document.getElementById ("torrent_directory").value.trim ());
            configuration.setConfigurationItem ("instance_name", document.getElementById ("instance_name").value.trim ());
            configuration.setConfigurationItem ("keybase_username", document.getElementById ("keybase_username").value.trim ());

            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        configuration.configuration_exists
                        (
                            {
                                success: function ()
                                {
                                    configuration.saveConfiguration (cb);
                                },
                                error: function ()
                                {
                                    make_database
                                    (
                                        configuration.getConfigurationDatabase (),
                                        {
                                            success: function () { configuration.saveConfiguration (cb); },
                                            error: cb.error
                                        },
                                        null,
                                        standard_validation
                                    );
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        alert ("You must be logged in to save the configuration.");
                    }
                }
            );
        }

        /**
         * @summary Create proxy entries in the CouchDB local configuration event handler.
         * @description Creates http proxy entries for keybase.io and the local deluge-web.
         * @param {object} event - the create proxies button pressed event
         * @function create_proxies
         * @memberOf module:configurator
         */
        function create_proxies (event)
        {
            $.couch.config
            (
                {
                    success: function ()
                    {
                        $.couch.config
                        (
                            {
                                success: function () { alert ("proxies configured"); },
                                error: function () { alert ("proxy configuration failed"); }
                            },
                            "httpd_global_handlers",
                            "keybase",
                            "{couch_httpd_proxy, handle_proxy_req, <<\"https://keybase.io/\">>}"
                        );
                    },
                    error: function () { alert ("proxy configuration failed"); }
                },
                "httpd_global_handlers",
                "json",
                "{couch_httpd_proxy, handle_proxy_req, <<\"http://localhost:8112\">>}"
            );
        }

        /**
         * @summary Update the checkbox for security of the local database.
         * @param {string} db - the name of the database to interrogate
         * @function create_proxies
         * @memberOf module:configurator
         */
        function update_local_security_state (db)
        {
            if ("" != db)
                is_secure
                (
                    db,
                    {
                        success: function (secure)
                        {
                            var element;
                            element = document.getElementById ("local_database_security");
                            element.classList.remove ("hidden");
                            element = document.getElementById ("local_database_secure");
                            element.removeAttribute ("disabled");
                            element.checked = secure;
                        },
                        error: function ()
                        {
                            var element;
                            element = document.getElementById ("local_database_security");
                            element.classList.add ("hidden");
                            element = document.getElementById ("local_database_secure");
                            element.setAttribute ("disabled", "disabled");
                        }
                    }
                );
        }

        /**
         * @summary Update the existence state of a database.
         * @param {string} id_input - the element id of the user entered name of the database
         * @param {string} id_addon - the element id of the addon to update
         * @function update_addon
         * @memberOf module:configurator
         */
        function update_addon (id_input, id_addon)
        {
            var addon;
            var db;

            addon = document.getElementById (id_addon);
            db = document.getElementById (id_input).value.trim ();
            addon.innerHTML = "";
            if ("" == db)
                addon.classList.add ("invisible");
            else
                addon.classList.remove ("invisible");
            if (-1 != databases.indexOf (db))
            {
                addon.innerHTML = "exists";
                addon.classList.remove ("to_be_created");
                addon.classList.add ("exists");
            }
            else
            {
                addon.innerHTML = "will be created";
                addon.classList.remove ("exists");
                addon.classList.add ("to_be_created");
            }
        }

        /**
         * @summary Update the form state for creating databases.
         * @param {object} event - the event that triggered the update request
         * @function update_database_state
         * @memberOf module:configurator
         */
        function update_database_state (event)
        {
            if (null == databases)
                $.couch.allDbs
                (
                    {
                        success: function (data)
                        {
                            databases = data;
                            update_database_state ();
                        }
                    }
                );
            else
                if ("undefined" == typeof (event)) // update all
                {
                    update_addon ("local_database", "local_database_state");
                    update_addon ("pending_database", "pending_database_state");
                    update_addon ("public_database", "public_database_state");
                    update_addon ("tracker_database", "tracker_database_state");
                    update_local_security_state (document.getElementById ("local_database").value.trim ());
                }
                else
                {
                    update_addon (event.target.id, event.target.getAttribute ("aria-describedby"));
                    if ("local_database" == event.target.id)
                        update_local_security_state (document.getElementById (event.target.id).value.trim ());
                }
        }

        /**
         * Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @summary Initialize the configurator.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @function init
         * @memberOf module:configurator
         */
        function init ()
        {
            $.get
            (
                template,
                function (template)
                {
                    page.layout ().content.innerHTML = mustache.render (template);

                    document.getElementById ("local_database").value = configuration.getConfigurationItem ("local_database");
                    document.getElementById ("pending_database").value = configuration.getConfigurationItem ("pending_database");
                    document.getElementById ("public_database").value = configuration.getConfigurationItem ("public_database");
                    document.getElementById ("tracker_database").value = configuration.getConfigurationItem ("tracker_database");
                    document.getElementById ("save_configuration").onclick = save;

                    document.getElementById ("local_database").oninput = update_database_state;
                    document.getElementById ("pending_database").oninput = update_database_state;
                    document.getElementById ("public_database").oninput = update_database_state;
                    document.getElementById ("tracker_database").oninput = update_database_state;
                    update_database_state (); // set up initial values

                    document.getElementById ("torrent_directory").value = configuration.getConfigurationItem ("torrent_directory");
                    document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
                    document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
                    document.getElementById ("configure_proxies").onclick = create_proxies;
                }
            );
        }

        return (
            {
                initialize: init,
                make_designdoc: make_designdoc,
                make_database: make_database,
            }
        );
    }
);