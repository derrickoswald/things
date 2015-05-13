/**
 * @fileOverview Initial system configuration user interface.
 * @name configurator
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache", "login"],
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
        var template = "templates/configuration.mst";

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
                    map: "function(doc) { if (doc.tracker) emit (doc._id, doc); }"
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
         * @summary Make the local database secure by adding the _security document.
         * @description Stores a security policy that only allows an admin to
         * read and write the database.
         * @function make_secure
         * @memberOf module:configurator
         * @param {string} name - the name of the database to secure
         * @param {object} security - the security document
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
                        alert (name + " _security created");
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
                        }

                        $.couch.db (name).saveDoc
                        (
                            doc,
                            {
                                success: function ()
                                {
                                    alert (name + " _security deleted");
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
         * @function make_designdoc
         * @memberOf module:configurator
         * @param {string} dbname - the name of the database to create the design document in
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
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
         * adds atandard views and logged-in security.
         * @function make_database
         * @memberOf module:configurator
         * @param {string} dbname - the name of the database to create
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
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
                };
            $.couch.db (dbname).create (options);
        }

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
                                    alert (name + " database created");
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

        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            var cb = {};
            cb.success = function (data)
            {
                console.log (data);
                alert ("Configuration saved.");
                window.location.reload (true);
            };
            cb.error = function (status) { console.log (status); alert ("Configuration save failed."); };

            configuration.setConfigurationItem ("local_database", document.getElementById ("local_database").value);
            configuration.setConfigurationItem ("pending_database", document.getElementById ("pending_database").value);
            configuration.setConfigurationItem ("public_database", document.getElementById ("public_database").value);
            configuration.setConfigurationItem ("tracker_database", document.getElementById ("tracker_database").value);

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

        function init ()
        {
            $.get
            (
                template,
                function (template)
                {
                    function create_local ()   { create_database ("local_database",   standard_views, standard_validation, read_restricted); };
                    function create_pending () { create_database ("pending_database", standard_views); };
                    function create_public ()  { create_database ("public_database",  standard_views, standard_validation); };
                    function create_tracker () { create_database ("tracker_database", tracker_views); };

                    page.layout ().content.innerHTML = mustache.render (template);

                    document.getElementById ("local_database").value = configuration.getConfigurationItem ("local_database");
                    document.getElementById ("pending_database").value = configuration.getConfigurationItem ("pending_database");
                    document.getElementById ("public_database").value = configuration.getConfigurationItem ("public_database");
                    document.getElementById ("tracker_database").value = configuration.getConfigurationItem ("tracker_database");
                    document.getElementById ("save_configuration").onclick = save;

                    document.getElementById ("create_local").onclick = create_local;
                    document.getElementById ("create_pending").onclick = create_pending;
                    document.getElementById ("create_public").onclick = create_public;
                    document.getElementById ("create_tracker").onclick = create_tracker;
                    document.getElementById ("secure").onclick = function (event) { make_secure (configuration.getConfigurationItem ("local_database"), read_restricted); };
                    document.getElementById ("insecure").onclick = function (event) { make_insecure (configuration.getConfigurationItem ("local_database")); };
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
)