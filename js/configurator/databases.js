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
         * List of current existing databases.
         * This is cached to avoid a round-trip for each character entered in the database name fields.
         * @type {string[]}
         * @memberOf module:configurator/databases
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
         * @param {object} search - the full text searches to add to the design document
         * @param {boolean} security - <em>optional</em> security document to attach to the database
         * @function create_database
         * @memberOf module:configurator/databases
         */
        function create_database (name, views, validation, search, security)
        {
            database.make_database
            (
                name,
                {
                    success: function ()
                    {
                        // manually add the database to the list
                        // NOTE: a complete refresh happens after the save operation completes
                        if (list)
                            list.push (name);
                        update_database_state ();
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
                validation,
                search
            );
        }

        function create_local ()        { create_database (configuration.getConfigurationItem ("local_database"),   database.standard_views, database.standard_validation, database.standard_search); };
        function create_secure_local () { create_database (configuration.getConfigurationItem ("local_database"),   database.standard_views, database.standard_validation, database.standard_search, database.read_restricted ); };
        function create_pending ()      { create_database (configuration.getConfigurationItem ("pending_database"), database.standard_views, null,                         database.standard_search); };
        function create_public ()       { create_database (configuration.getConfigurationItem ("public_database"),  database.standard_views, database.standard_validation, database.standard_search); };
        function create_tracker ()      { create_database (configuration.getConfigurationItem ("tracker_database"), database.tracker_views); };

        /**
         * @summary Set the security on the local database.
         * @description Applies or removes read_restricted security to a database.
         * Does nothing if the database is already set to the desired security.
         * @param {string} db - the database name to make secure/insecure
         * @param {boolean} secure - the desired security state
         * @function change_security
         * @memberOf module:configurator/databases
         */
        function change_security (db, secure)
        {
            database.is_secure
            (
                db,
                {
                    success: function (currently_secure)
                    {
                        if (currently_secure && !secure)
                            database.make_insecure
                            (
                                db,
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
                                db,
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

        /**
         * @summary Make the databases that don't already exist.
         * @description Calls the creation function for each database that isn't listed yet.
         * @param {object} event - the save button press event
         * @function make_databases
         * @memberOf module:configurator/databases
         */
        function make_databases ()
        {
            var db;
            var secure;

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
                    // no name change, change in security only?
                    change_security (configuration.getConfigurationItem ("local_database"), secure);
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
            // refresh display of databases after the save operation
            list = null;
            update_database_state ();
            // refresh display on the RHS
            page.fetch_databases ({ success: page.draw });
        };

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document and makes the databases.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator/databases
         */
        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            configuration.setConfigurationItem ("local_database", document.getElementById ("local_database").value.trim ());
            configuration.setConfigurationItem ("pending_database", document.getElementById ("pending_database").value.trim ());
            configuration.setConfigurationItem ("public_database", document.getElementById ("public_database").value.trim ());
            configuration.setConfigurationItem ("tracker_database", document.getElementById ("tracker_database").value.trim ());
            configuration.saveConfiguration
            (
                {
                    success: function (data) { alert ("Configuration saved."); make_databases (); },
                    error: function (status) { console.log (status); alert ("Configuration save failed."); }
                }
            );
        }

        /**
         * @summary Update the checkbox for security of the local database.
         * @param {string} db - the name of the database to interrogate
         * @function update_local_security_state
         * @memberOf module:configurator/databases
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
                            element = document.getElementById ("local_database_secure");
                            element.checked = secure;
                        }
                    }
                );
        }

        /**
         * @summary Update the existence state of a database.
         * @param {string} id_input - the element id of the user entered name of the database
         * @param {string} id_addon - the element id of the addon to update
         * @function update_addon
         * @memberOf module:configurator/databases
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
         * @memberOf module:configurator/databases
         */
        function update_database_state (event)
        {
            if (null == list)
                $.couch.allDbs
                (
                    {
                        success: function (l)
                        {
                            list = l;
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
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:configurator/databases
         */
        function init (event)
        {
            document.getElementById ("local_database").value = configuration.getConfigurationItem ("local_database");
            document.getElementById ("pending_database").value = configuration.getConfigurationItem ("pending_database");
            document.getElementById ("public_database").value = configuration.getConfigurationItem ("public_database");
            document.getElementById ("tracker_database").value = configuration.getConfigurationItem ("tracker_database");

            document.getElementById ("local_database").addEventListener ("input", update_database_state);
            document.getElementById ("pending_database").addEventListener ("input", update_database_state);
            document.getElementById ("public_database").addEventListener ("input", update_database_state);
            document.getElementById ("tracker_database").addEventListener ("input", update_database_state);
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
                                { id: "save_databases", event: "click", code: save }
                            ],
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                }
            }
        );
    }
);