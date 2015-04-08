define
(
    ["mustache", "home", "login"],
    function (mustache, home, login)
    {
        var configuration_database = "configuration";
        var primary_key = "current_configuration";
        var template = "templates/configuration.mst";
        var configuration =
        {
            pending_database: "pending_things",
            local_database: "my_things",
            public_database: "public_things",
            localhost: "http://localhost:5984/"
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
         * Saves the configuration to a document.
         * @param {object} Handlers (success and error) for response.
         * @function saveConfiguration
         * @memberOf module:Configuration
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
         * Loads the configuration from a document.
         * @function loadConfiguration
         * @param {object} Handlers (success and error) for response.
         * @memberOf module:Configuration
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
                        copy = JSON.parse (JSON.stringify (data));
                        delete copy._id;
                        delete copy._rev;
                        configuration = copy;
                        options.success (configuration);
                    },
                    error: options.error
                }
            );
        }

        /**
         * Get a configuration item from the in-memory current configuration.
         * @param {string} key the name of the configuration property to get
         * @function getConfigurationItem
         * @memberOf module:Configuration
         */
        function getConfigurationItem (key)
        {
            return (configuration[key]);
        }

        /**
         * Set the current value of a configuration item.
         * @param {string} key the name of the configuration property to set
         * @param {string} value the value of the configuration property
         * @function setConfigurationItem
         * @memberOf module:Configuration
         */
        function setConfigurationItem (key, value)
        {
            configuration[key] = value;
        }

        /**
         * Make the database secure by adding the _security document.
         * @function make_secure
         * @memberOf module:Configuration
         */
        function make_secure ()
        {
            var doc =
            {
                _id: "_security",
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
            $.couch.db ("things").saveDoc
            (
                doc,
                {
                    success: function ()
                    {
                        alert ("things _security created");
                    },
                    error: function ()
                    {
                        alert ("things _security creation failed");
                    }
                }
            );
        }

        /**
         * Remove the contents of the _security document, makeing the database again insecure.
         * @function make_insecure
         * @memberOf module:Configuration
         */
        function make_insecure ()
        {
            $.couch.db ("things").openDoc
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

                        $.couch.db ("things").saveDoc
                        (
                            doc,
                            {
                                success: function ()
                                {
                                    alert ("things _security deleted");
                                },
                                error: function (status)
                                {
                                    alert ("things _security deletion failed " + JSON.stringify (status, null, 4));
                                }
                            }
                        );
                    },
                    error: function (status)
                    {
                        alert ("things _security fetch failed " + JSON.stringify (status, null, 4));
                    }
                }
            );

        }

        function make_designdoc (dbname, options, views, secure)
        {
            var doc =
            {
                _id: "_design/" + dbname,
            };
            if (views)
               doc.views =
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
                }

            if (secure)
                doc.validate_doc_update =
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
            $.couch.db (dbname).saveDoc
            (
                doc,
                options
            );
        }

        function make_database (dbname, options, secure)
        {
            var original_fn;

            options = options || {};
            original_fn = options.success;
            if (secure)
                options.success = function ()
                {
                    if (original_fn)
                        options.success = original_fn;
                    else
                        delete options.success;
                    make_designdoc (dbname, options, false, true);
                };
            $.couch.db (dbname).create (options);
        }

        // make the design document
        function make_design_doc ()
        {
            // todo: get "public_things" database name from configuration
            make_designdoc
            (
                "public_things",
                {
                    success: function ()
                    {
                        alert ("public_things database created");
                    },
                    error: function ()
                    {
                        alert ("make design doc failed");
                    }
                },
                true,
                true);
        }

        function make_public ()
        {
            // todo: get "public_things" database name from configuration
            make_database
            (
                "public_things",
                {
                    success: make_design_doc,
                    error: function ()
                    {
                        alert ("database creation failed");
                    }
                }
            );
        }

        /**
         * Check for configuration database existence.
         * @param {object} Handlers (success and error) for response.
         * @function configuration_exists
         * @memberOf module:Configuration
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
         * Configuration setup.
         * Check for configuration database existence.
         * Read the configuration from the configuration database.
         * @param {object} Handlers (success and error) for response.
         * @function configuration_setup
         * @memberOf module:Configuration
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
                    success: function (data) { loadConfiguration (options); options.success (); },
                    error: options.error
                }
            );
        }

        function save (event)
        {
            event.preventDefault ();

            var cb = {};
            cb.success = function (data) { console.log (data); alert ("Configuration saved."); };
            cb.error = function (status) { console.log (status); alert ("Configuration save failed."); };

            setConfigurationItem ("pending_database", document.getElementById ("pending_database").value);
            setConfigurationItem ("local_database", document.getElementById ("local_database").value);
            setConfigurationItem ("public_database", document.getElementById ("public_database").value);
            setConfigurationItem ("localhost", document.getElementById ("localhost").value);

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
                                        true
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
                    var areas = home.layout ();
                    areas.content.innerHTML = mustache.render (template);
                    document.getElementById ("secure").onclick = make_secure;
                    document.getElementById ("insecure").onclick = make_insecure;
                    document.getElementById ("create").onclick = make_public;

                    document.getElementById ("pending_database").value = getConfigurationItem ("pending_database");
                    document.getElementById ("local_database").value = getConfigurationItem ("local_database");
                    document.getElementById ("public_database").value = getConfigurationItem ("public_database");
                    document.getElementById ("localhost").value = getConfigurationItem ("localhost");
                    document.getElementById ("save_configuration").onclick = save;
                }
            );
        }
        return (
            {
                initialize: init,
                make_designdoc: make_designdoc,
                make_database: make_database,
                configuration_setup: configuration_setup,
                getConfigurationItem: getConfigurationItem,
                setConfigurationItem: setConfigurationItem
            }
        );
    }
)