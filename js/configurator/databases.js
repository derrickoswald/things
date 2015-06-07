/**
 * @fileOverview Set up system databases.
 * @name databases
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database"],
    /**
     * @summary Database setup page and functions for loading and saving configuration data.
     * @description Database setup page, functions for loading and saving
     * configuration data to the configuration database and programatic
     * access to the configuration settings.
     * @name databases
     * @exports databases
     * @version 1.0
     */
    function (configuration, page, mustache, login, database)
    {
        /**
         * list of current existing databases
         * @type {string[]}
         * @memberOf module:databases
         */
        var list = null;

        /**
         * @summary Creates a database.
         * @description Creates the configured database and optionally
         * adds standard views and logged-in security.
         * Used as a generic function by the database creation handlers.
         * @param {string} name - the database name
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @param {boolean} security - <em>optional</em> security document to attach to the database
         * @function create_database
         * @memberOf module:databases
         */
        function create_database (name, views, validation, security)
        {
            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        database.make_database
                        (
                            name,
                            {
                                success: function ()
                                {
                                    if (security)
                                        database.make_secure
                                        (
                                            name,
                                            {
                                                success: update_database_state,
                                                error: function () { alert (name + " _security creation failed"); }
                                            },
                                            security
                                        );
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

        function create_local ()        { create_database (configuration.getConfigurationItem ("local_database"),   database.standard_views, database.standard_validation); };
        function create_secure_local () { create_database (configuration.getConfigurationItem ("local_database"),   database.standard_views, database.standard_validation, database.read_restricted ); };
        function create_pending ()      { create_database (configuration.getConfigurationItem ("pending_database"), database.standard_views); };
        function create_public ()       { create_database (configuration.getConfigurationItem ("public_database"),  database.standard_views, database.standard_validation); };
        function create_tracker ()      { create_database (configuration.getConfigurationItem ("tracker_database"), database.tracker_views); };

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:databases
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
                    if (-1 == list.indexOf (db))
                        if (secure)
                            create_secure_local ();
                        else
                            create_local ();
                    else
                        // no name change, change in security only ?
                        database.is_secure
                        (
                            configuration.getConfigurationItem ("local_database"),
                            {
                                success: function (currently_secure)
                                {
                                    if (currently_secure && !secure)
                                        database.make_insecure
                                        (
                                            configuration.getConfigurationItem ("local_database"),
                                            {
                                                success: update_database_state,
                                                error: function (status)
                                                {
                                                    alert (name + " _security deletion failed " + JSON.stringify (status, null, 4));
                                                }
                                            }
                                        );
                                    else if (!currently_secure && secure)
                                        database.make_secure
                                        (
                                            configuration.getConfigurationItem ("local_database"),
                                            {
                                                success: update_database_state,
                                                error: function ()
                                                {
                                                    alert (name + " _security creation failed");
                                                }
                                            },
                                            database.read_restricted
                                        );
                                }
                            }
                        );
                }

                db = configuration.getConfigurationItem ("pending_database");
                if (("" != db) && (-1 == list.indexOf (db)))
                    create_pending ();
                db = configuration.getConfigurationItem ("public_database");
                if (("" != db) && (-1 == list.indexOf (db)))
                    create_public ();
                db = configuration.getConfigurationItem ("tracker_database");
                if (("" != db) && (-1 == list.indexOf (db)))
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
                                    database.make_database
                                    (
                                        configuration.getConfigurationDatabase (),
                                        {
                                            success: function () { configuration.saveConfiguration (cb); },
                                            error: cb.error
                                        },
                                        null,
                                        database.standard_validation
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
         * @summary Update the checkbox for security of the local database.
         * @param {string} db - the name of the database to interrogate
         * @function create_proxies
         * @memberOf module:databases
         */
        function update_local_security_state (db)
        {
            if ("" != db)
                database.is_secure
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
         * @memberOf module:databases
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
            if (-1 != list.indexOf (db))
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
         * @memberOf module:databases
         */
        function update_database_state (event)
        {
            if (null == list)
                $.couch.allDbs
                (
                    {
                        success: function (data)
                        {
                            list = data;
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
         * @summary Initialize the database setup UI.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @function init
         * @memberOf module:databases
         */
        function init ()
        {
            document.getElementById ("local_database").value = configuration.getConfigurationItem ("local_database");
            document.getElementById ("pending_database").value = configuration.getConfigurationItem ("pending_database");
            document.getElementById ("public_database").value = configuration.getConfigurationItem ("public_database");
            document.getElementById ("tracker_database").value = configuration.getConfigurationItem ("tracker_database");

            document.getElementById ("local_database").oninput = update_database_state;
            document.getElementById ("pending_database").oninput = update_database_state;
            document.getElementById ("public_database").oninput = update_database_state;
            document.getElementById ("tracker_database").oninput = update_database_state;
            update_database_state (); // set up initial values
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "create_db",
                            title: "Databases",
                            template: "templates/configurator/databases.mst",
                            hooks:
                            [
                                { id: "save_databases", event: "click", code: save, obj: this }
                            ],
                            transitions:
                            {
                                enter: init,
                                obj: this
                            }
                        }
                    );
                }
            }
        );
    }
);