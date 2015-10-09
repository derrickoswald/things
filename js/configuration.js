/**
 * @fileOverview Configuration with backing store in a database.
 * @name configuration
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["database"],
    /**
     * @summary Functions for loading and saving configuration data.
     * @description Functions for loading and saving
     * configuration data to the configuration database and programmatic
     * access to the configuration settings.
     * @name configuration
     * @exports configuration
     * @version 1.0
     */
    function (database)
    {
        var version = 1.06;
        var configuration_database = "configuration";
        var primary_key = "default_configuration";
        var instance_uuid = "";

        // default configuration
        var configuration =
        {
            local_database: "my_things",
            pending_database: "pending_things",
            public_database: "public_things",
            tracker_database: "thing_tracker",
            instance_name: "",
            instance_uuid: "", // retrieved from the Welcome response
            keybase_username: "",
            deluge_password: "deluge",
            torrent_directory: "/torrents",
            deluge_couch_url: "http://127.0.0.1:5984",
            upstream_things: "" // retrieved from logs of replication requests, if possible
        };

        /**
         * @summary Return the version of this things code.
         * @returns the version as a floating point number
         * @function getVersion
         * @memberOf module:configuration
         */
        function getVersion ()
        {
            return (version);
        }

        /**
         * @summary Return the local CouchDB instance UUID.
         * @returns the UUID value from the CouchDB .ini file set,
         * or "" if the asynchronous call hasn't completed,
         * or the manually set UUID if this configuration is for a user.
         * @function getInstanceUUID
         * @memberOf module:configuration
         */
        function getInstanceUUID ()
        {
            return (instance_uuid);
        }

        /**
         * Check if local storage is supported.
         * @return <code>true</code> if the browser supports local storage.
         * @function haslLocalStorage
         * @memberOf module:configuration
         */
        function haslLocalStorage ()
        {
            var ret = false;

            try
            {
                ret = (("localStorage" in window) && (null != window["localStorage"]));
            }
            catch (e)
            {
            }

            return (ret);
          }

        /**
         * Store a property in local storage if possible.
         * @param {string} property the property name
         * @param {string} value the property value
         * @function storeProperty
         * @memberOf module:configuration
         */
        function storeProperty (property, value)
        {
            if (haslLocalStorage ())
                localStorage.setItem (property, value);
        }

        /**
         * Retrieve a property from local storage if possible.
         * @param {string} property the property name
         * @function loadProperty
         * @memberOf module:configuration
         */
        function loadProperty (property)
        {
            return (haslLocalStorage () ? localStorage.getItem (property) : null);
        }

        /**
         * Deletes the property from local storage.
         * @param {string} property the property name
         * @function clearProperty
         * @memberOf module:configuration
         */
        function clearProperty (property)
        {
            if (haslLocalStorage ())
                localStorage.remove (property);
        }

        /**
         * Get the name of the configuration database.
         * @function getConfigurationDatabase
         * @memberOf module:configuration
         */
        function getConfigurationDatabase ()
        {
            return (configuration_database);
        }

        /**
         * Get the name of the configuration document for a specific user.
         * @function getUserConfigurationName
         * @memberOf module:configuration
         */
        function getUserConfigurationName (name, options)
        {
            options = options || {};

            // get the users's record
            $.couch.db ("_users").openDoc
            (
                "org.couchdb.user:" + name,
                {
                    success: function (data)
                    {
                        var config = data.configuration || primary_key;

                        // get all the configuration documents and check if config exists
                        $.couch.db (getConfigurationDatabase ()).allDocs
                        (
                            {
                                success: function (data)
                                {
                                    var found = false;
                                    for (var i = 0; !found && (i < data.total_rows); i++)
                                        if (data.rows[i].id == config)
                                            found = true;
                                    if (options.success)
                                        options.success (found ? config : primary_key);
                                },
                                error: function ()
                                {
                                    if (options.success)
                                        options.success (primary_key);
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        if (options.success)
                            options.success (primary_key);
                    }
                }
            );
        }

        /**
         * Get the name of the configuration document.
         * @function getConfigurationName
         * @memberOf module:configuration
         */
        function getConfigurationName (options)
        {
            options = options || {};
            $.couch.session
            (
                {
                    success: function (data)
                    {
                        if (null == data.userCtx.name) // not logged in
                        {
                            if (options.success)
                                options.success (primary_key);
                        }
                        else
                            // check for user-specific configuration
                            getUserConfigurationName (data.userCtx.name, options);
                    },
                    error: function ()
                    {
                        if (options.success)
                            options.success (primary_key);
                    }
                }
            );
        }

        /**
         * @summary Saves the configuration to a document.
         * @description Creates or updates the current configuration document in
         * the configuration database
         * @param {object} options Handlers (success and error) for the response.
         * @function saveConfiguration
         * @memberOf module:configuration
         */
        function save (options)
        {
            var copy;

            // get the name of the configuration document
            getConfigurationName
            (
                {
                    success: function (config_name)
                    {
                        // copy the current configuration
                        copy = JSON.parse (JSON.stringify (configuration));
                        // get the current document
                        $.couch.db (getConfigurationDatabase ()).openDoc
                        (
                            config_name,
                            {
                                success: function (data)
                                {
                                    copy._id = data._id;
                                    copy._rev = data._rev;
                                    $.couch.db (getConfigurationDatabase ()).saveDoc
                                    (
                                        copy,
                                        options
                                    );
                                },
                                error: function (status)
                                {
                                    copy._id = config_name;
                                    $.couch.db (getConfigurationDatabase ()).saveDoc
                                    (
                                        copy,
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
         * @summary Saves the configuration to a document.
         * @description Creates or updates the current configuration document in
         * the configuration database, after creating the configuration database if needed.
         * @param {object} options Handlers (success and error) for the response.
         * @function saveConfiguration
         * @memberOf module:configuration
         */
        function saveConfiguration (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            configuration_exists
            (
                {
                    success : function ()
                    {
                        save (options);
                    },
                    error : function ()
                    {
                        database.make_database
                        (
                            getConfigurationDatabase (),
                            {
                                success : function ()
                                {
                                    save (options);
                                },
                                error : options.error
                            },
                            null,
                            database.standard_validation
                        );
                    }
                }
            );
        }

        /**
         * @summary Loads the configuration from a document.
         * @description Read the configuration from the configuration database
         * @param {object} options Handlers (success and error) for the response.
         * @function loadConfiguration
         * @memberOf module:configuration
         */
        function loadConfiguration (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            // get the name of the configuration document
            getConfigurationName
            (
                {
                    success: function (config)
                    {
                        // get the current document
                        $.couch.db (getConfigurationDatabase ()).openDoc
                        (
                            config,
                            {
                                success: function (data)
                                {
                                    var custom;

                                    // copy the configuration
                                    custom = JSON.parse (JSON.stringify (data));
                                    // remove the couchdb specific properties
                                    delete custom._id;
                                    delete custom._rev;
                                    // transfer any items from in-memory configuration that are not in the db configuration
                                    for (var p in configuration)
                                        if (configuration.hasOwnProperty (p) && !(custom.hasOwnProperty (p)))
                                            custom[p] = configuration[p];
                                    // delete any items present in db configuration that are not in the in-memory configuration
                                    for (var property in custom)
                                        if (custom.hasOwnProperty (property) && !(configuration.hasOwnProperty (property)))
                                            delete custom[property];
                                    configuration = custom;
                                    options.success (configuration);
                                },
                                error: options.error
                            }
                        );
                    }
                }
            );
        }

        /**
         * @summary Get a configuration item from the in-memory current configuration.
         * @description Get the configuration string for the key.
         * @param {string} key the name of the configuration property to get
         * @function getConfigurationItem
         * @memberOf module:configuration
         */
        function getConfigurationItem (key)
        {
            return (configuration[key]);
        }

        /**
         * @summary Set the current value of a configuration item.
         * @description Set the configuration string for the key.
         * @param {string} key the name of the configuration property to set
         * @param {string} value the value of the configuration property
         * @function setConfigurationItem
         * @memberOf module:configuration
         */
        function setConfigurationItem (key, value)
        {
            configuration[key] = value;
        }

        /**
         * @summary Get the prefix used by the jQuery CouchDB addon.
         * @description For a vhosted system, the prefix is usually an entry
         * in the rewrites that accesses the CouchDB api, rather than the
         * vhosted document root at _design/{db}/_rewrite.
         * @function getPrefix
         * @memberOf module:configuration
         */
        function getPrefix ()
        {
            return ($.couch.urlPrefix);
        }

        /**
         * @summary Get the web page root.
         * @description Like <code>document.location.origin</code> but also adds
         * the necessary rewrite prefix for the virtual host (if any).
         * So, for example, <code>http:localhost:5984</code> remains unchanged
         * but <code>http:thingtracker.no-ip.org</code> becomes
         * <code>http:thingtracker.no-ip.org/root</code> when used
         * with a vhost and <code>root</code> rewrite rule.
         * @function getDocumentRoot
         * @memberOf module:configuration
         */
        function getDocumentRoot ()
        {
            return (document.location.origin + getPrefix ());
        }

        /**
         * @summary Get the current CouchDB unique uuid.
         * @description Calls the options.success function with the value of this instance's UUID value.
         * @function get_uuid
         * @memberOf module:configuration
         */
        function get_uuid (options)
        {
            options = options || {};
            if (!options.success)
                options.success = function (uuid) { console.log ("uuid: " + uuid); };
            $.get
            (
                getDocumentRoot (),
                function (welcome) // {"couchdb":"Welcome","uuid":"fe736197b3e3e543fdba84b1c2385111","version":"1.6.1","vendor":{"version":"14.04","name":"Ubuntu"}}
                {
                    welcome = JSON.parse (welcome);
                    options.success (welcome.uuid);
                }
            );
        }

        /**
         * @summary Try and populate the upstream_things member.
         * @description Examines the CouchDB logs looking for evidence of a _replication to this
         * things system from another one, and if found, fill in the upstream_things field
         * in the configuration with this value.
         * @function check_for_replication
         * @memberOf module:configuration
         */
        function check_for_replication ()
        {
            if ("" == getConfigurationItem ("upstream_things")) // only do this if it isn't set yet
            {
                var url;
                var xmlhttp;

                url = getDocumentRoot () + "/_log?bytes=1000000";
                xmlhttp = new XMLHttpRequest ();
                xmlhttp.open ("get", url, true);
                xmlhttp.setRequestHeader ("Content-Type", "application/json");
                xmlhttp.onreadystatechange = function ()
                {
                    if (4 == xmlhttp.readyState)
                        if (200 == xmlhttp.status)
                        {
                            var regexp;
                            var match;

                            // [Fri, 04 Sep 2015 05:23:59 GMT] [info] [<0.108.0>] starting new replication `b2682537a732b1b49969082d18b78701+create_target` at <0.158.0> (`http://thingtracker.no-ip.org/root/things/` -> `things`)
                            regexp = /starting new replication.*\(\`(.*)\` \-\> \`things\`\)/;
                            match = regexp.exec (xmlhttp.responseText);
                            if (match)
                                setConfigurationItem ("upstream_things", match[1]);
                            else
                                console.log ("no replication entry found in the logs");
                        }
                        else
                            console.log ("failed to read logs when checking for replication");
                };
                xmlhttp.send ();
            }
        }

        function dummy () // just here so Eclipse's brain dead outline mode works
        {
        }

        /**
         * @summary Check for configuration database existence.
         * @param {object} options Handlers (success and error) for response
         * @function configuration_exists
         * @memberOf module:configuration
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
                        if (-1 != data.indexOf (getConfigurationDatabase ()))
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
         * @param {object} options Handlers (success and error) for response.
         * @function configuration_setup
         * @memberOf module:configuration
         */
        function configuration_setup (options)
        {
            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            get_uuid
            (
                {
                    success: function (uuid)
                    {
                        instance_uuid = uuid;
                        if ("" == configuration.instance_uuid)
                            configuration.instance_uuid = uuid;
                        configuration_exists
                        (
                            {
                                success: function ()
                                {
                                    loadConfiguration (options);
                                },
                                error: function ()
                                {
                                    check_for_replication ();
                                    options.error ();
                                }
                            }
                        );
                    },
                    error: options.error
                }
            );
        }

        return (
            {
                getVersion: getVersion,
                getInstanceUUID: getInstanceUUID,
                getConfigurationDatabase: getConfigurationDatabase,
                saveConfiguration: saveConfiguration,
                loadConfiguration: loadConfiguration,
                getConfigurationItem: getConfigurationItem,
                setConfigurationItem: setConfigurationItem,
                storeProperty: storeProperty,
                loadProperty: loadProperty,
                clearProperty: clearProperty,
                getPrefix: getPrefix,
                getDocumentRoot: getDocumentRoot,
                configuration_exists: configuration_exists,
                configuration_setup: configuration_setup
            }
        );
    }
);
