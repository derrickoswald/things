/**
 * @fileOverview Configuration with backing store in a database.
 * @name configuration
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    /**
     * @summary Functions for loading and saving configuration data.
     * @description Functions for loading and saving
     * configuration data to the configuration database and programatic
     * access to the configuration settings.
     * @name configuration
     * @exports configuration
     * @version 1.0
     */
    function ()
    {
        var configuration_database = "configuration";
        var primary_key = "current_configuration";

        // default configuration
        var configuration =
        {
            local_database: "my_things",
            pending_database: "pending_things",
            public_database: "public_things",
            tracker_database: "thing_tracker"
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
//                for (var property in configuration)
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
//                for (var property in configuration)
//                    if (configuration.hasOwnProperty (property))
//                        localStorage.remove (property);
//        }

        function getConfigurationDatabase ()
        {
            return (configuration_database);
        }

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
                        for (var property in configuration)
                            if (configuration.hasOwnProperty (property) && !(copy[property]))
                                copy[property] = configuration[property];
                        // delete any items present in db configuration that are not in in-memory configuration
                        for (var property in copy)
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
         * @summary Get the web page root.
         * @description Like <code>document.location.origin</code> but also adds
         * the necessary rewrite prefix for the virtual host (if any).
         * So, for example, <code>http:localhost:5984</code> remains unchanged
         * but <code>http:thingtracker.no-ip.org</code> becomes
         * <code>http:thingtracker.no-ip.org/root</code> when used
         * with a vhost and <code>root</code> rewrite rule.
         */
        function getDocumentRoot ()
        {
            return (document.location.origin + $.couch.urlPrefix);
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

        return (
            {
                getConfigurationDatabase: getConfigurationDatabase,
                saveConfiguration: saveConfiguration,
                loadConfiguration: loadConfiguration,
                getConfigurationItem: getConfigurationItem,
                setConfigurationItem: setConfigurationItem,
                getDocumentRoot: getDocumentRoot,
                configuration_exists: configuration_exists,
                configuration_setup: configuration_setup
            }
        );
    }
)