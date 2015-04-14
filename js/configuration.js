/**
 * @fileOverview Configuration with backing store in a database.
 * @name configuration
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["page", "mustache", "login"],
    /**
     * @summary Database setup page and functions for loading and saving configuration data.
     * @description Database setup page, functions for loading and saving
     * configuration data to the configuration database and programatic
     * access to the configuration settings.
     * @name configuration
     * @exports configuration
     * @version 1.0
     */
    function (page, mustache, login)
    {
        var configuration_database = "configuration";
        var primary_key = "current_configuration";
        var template = "templates/configuration.mst";
        // default configuration
        var configuration =
        {
            local_database: "my_things",
            pending_database: "pending_things",
            public_database: "public_things",
            tracker_database: "thing_tracker"
        };

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

//        /**
//         * Check if local storage is supported.
//         * @return <code>true</code> if the browser supports local storage.
//         * @function haslLocalStorage
//         * @memberOf module:configuration
//         */
//        function haslLocalStorage ()
//        {
//            var ret = false;
//
//            try
//            {
//                ret = (("localStorage" in window) && (null != window["localStorage"]));
//            }
//            catch (e)
//            {
//            }
//
//            return (ret);
//          }
//
//        /**
//         * Store the configuration settings in local storage if possible.
//         * @function storeConfiguration
//         * @memberOf module:configuration
//         */
//        function storeConfiguration ()
//        {
//            if (haslLocalStorage ())
//                for (property in configuration)
//                    if (configuration.hasOwnProperty (property))
//                        localStorage.setItem (property, configuration[property]);
//        }
//
//        /**
//         * Deletes the configuration from local storage.
//         * @function clearConfiguration
//         * @memberOf module:Configuration
//         */
//        function clearConfiguration ()
//        {
//            if (haslLocalStorage ())
//                for (property in configuration)
//                    if (configuration.hasOwnProperty (property))
//                        localStorage.remove (property);
//        }

        /**
         * @summary Saves the configuration to a document.
         * @description Creates or updates the current configuration document in
         * the configuration database
         * @function saveConfiguration
         * @memberOf module:configuration
         * @param {object} options Handlers (success and error) for the response.
         */
        function saveConfiguration (options)
        {
            var copy;

            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            // copy the current configuration
            copy = JSON.parse (JSON.stringify (configuration));
            // get the current document
            $.couch.db (configuration_database).openDoc
            (
                primary_key,
                {
                    success: function (data)
                    {
                        copy._id = data._id;
                        copy._rev = data._rev;
                        $.couch.db (configuration_database).saveDoc
                        (
                            copy,
                            options
                        );
                    },
                    error: function (status)
                    {
                        copy._id = primary_key;
                        $.couch.db (configuration_database).saveDoc
                        (
                            copy,
                            options
                        );
                    }
                }
            );
        }

        /**
         * @summary Loads the configuration from a document.
         * @description Read the configuration from the configuration database
         * @function loadConfiguration
         * @memberOf module:configuration
         * @param {object} options Handlers (success and error) for the response.
         */
        function loadConfiguration (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            // get the current document
            $.couch.db (configuration_database).openDoc
            (
                primary_key,
                {
                    success: function (data)
                    {
                        // copy the configuration
                        var copy = JSON.parse (JSON.stringify (data));
                        // remove the couchdb specific properties
                        delete copy._id;
                        delete copy._rev;
                        // transfer any items from in-memory configuration that are not in db configuration
                        for (property in configuration)
                            if (configuration.hasOwnProperty (property) && !(copy[property]))
                                copy[property] = configuration[property];
                        // delete any items present in db configuration that are not in in-memory configuration
                        for (property in copy)
                            if (copy.hasOwnProperty (property) && !(configuration[property]))
                                delete copy[property];
                        configuration = copy;
                        options.success (configuration);
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Get a configuration item from the in-memory current configuration.
         * @description Get the configuration string for the key.
         * @function getConfigurationItem
         * @memberOf module:configuration
         * @param {string} key the name of the configuration property to get
         */
        function getConfigurationItem (key)
        {
            return (configuration[key]);
        }

        /**
         * @summary Set the current value of a configuration item.
         * @description Set the configuration string for the key.
         * @function setConfigurationItem
         * @memberOf module:configuration
         * @param {string} key the name of the configuration property to set
         * @param {string} value the value of the configuration property
         */
        function setConfigurationItem (key, value)
        {
            configuration[key] = value;
        }

        /**
         * @summary Make the local database secure by adding the _security document.
         * @description Stores a security policy that only allows an admin to
         * read and write the database.
         * @function make_secure
         * @memberOf module:configuration
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
         * @memberOf module:configuration
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
         * @memberOf module:configuration
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
         * @memberOf module:configuration
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
                        var name = getConfigurationItem (config_id);
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

        /**
         * @summary Check for configuration database existence.
         * @function configuration_exists
         * @memberOf module:configuration
         * @param {object} options Handlers (success and error) for response
         */
        function configuration_exists (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            $.couch.allDbs
            (
                {
                    success: function (data)
                    {
                        if (-1 != data.indexOf (configuration_database))
                            options.success ();
                        else
                            options.error ("no configuration database");
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Configuration setup.
         * @description Check for configuration database existence.
         * Read the configuration from the configuration database.
         * @function configuration_setup
         * @memberOf module:configuration
         * @param {object} options Handlers (success and error) for response.
         */
        function configuration_setup (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            configuration_exists
            (
                {
                    success: function () { loadConfiguration (options); },
                    error: options.error
                }
            );
        }

        function save (event)
        {
            event.preventDefault ();

            var cb = {};
            cb.success = function (data)
            {
                console.log (data);
                alert ("Configuration saved.");
                window.location.reload (true);
            };
            cb.error = function (status) { console.log (status); alert ("Configuration save failed."); };

            setConfigurationItem ("local_database", document.getElementById ("local_database").value);
            setConfigurationItem ("pending_database", document.getElementById ("pending_database").value);
            setConfigurationItem ("public_database", document.getElementById ("public_database").value);
            setConfigurationItem ("tracker_database", document.getElementById ("tracker_database").value);

            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        configuration_exists
                        (
                            {
                                success: function ()
                                {
                                    saveConfiguration (cb);
                                },
                                error: function ()
                                {
                                    make_database
                                    (
                                        configuration_database,
                                        {
                                            success: function () { saveConfiguration (cb); },
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

                    document.getElementById ("local_database").value = getConfigurationItem ("local_database");
                    document.getElementById ("pending_database").value = getConfigurationItem ("pending_database");
                    document.getElementById ("public_database").value = getConfigurationItem ("public_database");
                    document.getElementById ("tracker_database").value = getConfigurationItem ("tracker_database");
                    document.getElementById ("save_configuration").onclick = save;

                    document.getElementById ("create_local").onclick = create_local;
                    document.getElementById ("create_pending").onclick = create_pending;
                    document.getElementById ("create_public").onclick = create_public;
                    document.getElementById ("create_tracker").onclick = create_tracker;
                    document.getElementById ("secure").onclick = make_secure;
                    document.getElementById ("insecure").onclick = make_insecure;
                }
            );
        }

        // initialize on first load if possible
        configuration_setup ();

        return (
            {
                initialize: init,
                make_designdoc: make_designdoc,
                make_database: make_database,
                configuration_exists: configuration_exists,
                configuration_setup: configuration_setup,
                getConfigurationItem: getConfigurationItem,
                setConfigurationItem: setConfigurationItem
            }
        );
    }
)