/**
 * @fileOverview Initial setup for importing things.
 * @name configurator/import
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../login", "../configuration", "../database"],
    /**
     * @summary Perform setup operations for the thingimporter.
     * @name configurator/import
     * @exports configurator/import
     * @version 1.0
     */
    function (login, configuration, database)
    {
        var pending = configuration.getConfigurationItem ("pending_database");

        /**
         * Check for the existence of the database.
         * @memberOf module:configurator/import
         */
        function check_db ()
        {
            var dbname = $ ("#database_name").val ();
            function db_list_receiver (list)
            {
                var exists = (-1 != list.indexOf (dbname));
                document.getElementById ("create_import_database_button").disabled = exists;
                var details = $ ("#import_database_created");
                if (exists)
                    details.removeClass ("hidden");
                else
                    details.addClass ("hidden");
            }
            $.couch.allDbs
            (
                {
                    success: db_list_receiver
                }
            );
        }

        /**
         * Make the view.
         * @memberOf module:configurator/import
         */
        function make_view ()
        {
            database.make_designdoc
            (
                $ ("#database_name").val (),
                {
                    success: check_db,
                    error: function () { alert ("make view failed"); }
                },
                true
            );
        }

        /**
         * Make the database.
         * @memberOf module:configurator/import
         */
        function make_db ()
        {
            database.make_database ($ ("#database_name").val (), { success: make_view, error: function () { alert ("database creation failed"); } });
        }

        /**
         * Check that CORS is set up accordingly.
         * @memberOf module:configurator/import
         */
        function check_CORS ()
        {
            function configuration_receiver (configuration)
            {
                var cors_enabled = configuration.httpd.enable_cors;
                var methods = configuration.cors.methods;
                var origins = configuration.cors.origins;
                var cors = (cors_enabled && (-1 != methods.indexOf ("PUT")) && (-1 != origins.indexOf ("thingiverse.com")));
                document.getElementById ("cors_enabled").innerHTML = (cors_enabled ? "true" : "false");
                document.getElementById ("cors_methods").innerHTML = methods;
                document.getElementById ("cors_origins").innerHTML = origins;
                document.getElementById ("configure_cors_button").disabled = cors;
                var details = $ ("#cors_configured");
                if (cors)
                    details.removeClass ("hidden");
                else
                    details.addClass ("hidden");

            };
            function problem (status)
            {
                alert ("problem " + status);
            }
            $.couch.config
            (
                {
                    success: configuration_receiver
                }
            );
        }

        /**
         * Turn on CORS support.
         * @memberOf module:configurator/import
         */
        function enable_cors (options)
        {
            $.couch.config
            (
                options,
                "httpd",
                "enable_cors",
                "true"
            );
        }

        /**
         * Set up CORS methods.
         * @memberOf module:configurator/import
         */
        function set_methods (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "methods",
                "GET,POST,PUT"
            );
        }

        /**
         * Set up CORS origins.
         * @memberOf module:configurator/import
         */
        function set_origins (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "origins",
                "http://www.thingiverse.com"
            );
        }

        /**
         * Set up CORS support for http://thingiverse.com.
         * @memberOf module:configurator/import
         */
        function setup_cors ()
        {
            enable_cors
            (
                {
                    success: function ()
                    {
                        set_methods
                        (
                            {
                                success: function ()
                                {
                                    set_origins
                                    (
                                        {
                                            success: function () { alert ("Restart CouchDB for changes to take effect"); check_CORS (); },
                                            error: function () { alert ("Allowing http://www.thingiverse.com as an origin failed"); check_CORS (); }
                                        }
                                    );
                                },
                                error: function () { alert ("Setting methods failed"); check_CORS (); }
                            }
                        );
                    },
                    error: function () { alert ("Enabling CORS failed"); }
                }
            );
        }

        /**
         * Initialize the import setup page.
         * @memberOf module:configurator/import
         */
        function init (event, data)
        {
            var parameters;

            // set the pending database name
            $ ("#database_name").val (pending);
            parameters =
            {
                success: function ()
                {
                    check_db ();
                    check_CORS ();
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        return (
            {
                getStep: function ()
                {
                    var setup_hooks =
                    [
                        { id: "create_import_database_button", event: "click", code: make_db, obj: this },
                        { id: "configure_cors_button", event: "click", code: setup_cors, obj: this }
                    ];
                    return ({ id: "import", title: "Importing", template: "templates/configurator/import.mst", hooks: setup_hooks, transitions: { enter: init, obj: this } });
                }
            }
        );
    }
);