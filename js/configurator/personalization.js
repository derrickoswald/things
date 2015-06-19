/**
 * @fileOverview System personalization step.
 * @name configurator/personalization
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database", "../restart", "../keybase"],
    /**
     * @summary Instance personalization step.
     * @description Sets the identifying information for this instance of the <em>things</em> system.
     * @name configurator/personalization
     * @exports configurator/personalization
     * @version 1.0
     */
    function (configuration, page, mustache, login, database, restart, keybase)
    {
        /**
         * @summary Get the current proxies from the CouchDB local configuration.
         * @description Gets all options from the httpd_global_handlers section.
         * @function get_proxy
         * @memberOf module:configurator/personalization
         */
        function get_proxy ()
        {
            var proxy = document.getElementById ("keybase_proxy");
            proxy.innerHTML = "";
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.keybase)
                        {
                            proxy.innerHTML = data.keybase;
                            fill_user_data ();
                        }
                    },
                },
                "httpd_global_handlers"
            );
        }

        /**
         * @summary Create a proxy entry.
         * @description Creates an http proxy entry for the provided name and url.
         * @param {object} options - functions for success and error callback
         * @function create_proxy
         * @memberOf module:configurator/personalization
         */
        function create_proxy (name, url, options)
        {
            $.couch.config
            (
                options,
                "httpd_global_handlers",
                name,
                "{couch_httpd_proxy, handle_proxy_req, <<\"" + url + "\">>}"
            );
        }

        /**
         * @summary Create proxy entry for keybase.io in the CouchDB local configuration.
         * @description Creates an http proxy entry for keybase.io.
         * @param {object} options - functions for success and error callback
         * @function create_keybase_proxy
         * @memberOf module:configurator/personalization
         */
        function create_keybase_proxy (options)
        {
            create_proxy ("keybase", "https://keybase.io", options);
        }

        /**
         * @summary Create the Keybase.io proxy and restart the CouchDB server.
         * @description Event handler for the Keybase button.
         * @function keybase_click
         * @memberOf module:configurator/personalization
         */
        function keybase_click (event)
        {
            create_keybase_proxy
            (
                {
                    success: function ()
                    {
                        restart.inject ();
                    }
                }
            );
        }

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator/personalization
         */
        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            var cb =
            {
                success: function (data) { console.log (data); alert ("Configuration saved."); },
                error: function (status) { console.log (status); alert ("Configuration save failed."); }
            };
            configuration.setConfigurationItem ("instance_name", document.getElementById ("instance_name").value.trim ());
            configuration.setConfigurationItem ("keybase_username", document.getElementById ("keybase_username").value.trim ());

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
        }

        /**
         * @summary Get the current CouchDB unique uuid.
         * @description Fills the form's uuid input element with the current value of the uuid.
         * @function get_uuid
         * @memberOf module:configurator/personalization
         */
        function get_uuid ()
        {
            $.get
            (
                configuration.getDocumentRoot (),
                function (welcome) // {"couchdb":"Welcome","uuid":"fe736197b3e3e543fdba84b1c2385111","version":"1.6.1","vendor":{"version":"14.04","name":"Ubuntu"}}
                {
                    welcome = JSON.parse (welcome);
                    document.getElementById ("couchdb_uuid").value = welcome.uuid;
                }
            );
        }

        /**
         * @summary Create a new CouchDB unique uuid.
         * @description Fills the form's uuid input element with a new value of the uuid.
         * @function create_uuid
         * @memberOf module:configurator/personalization
         */
        function create_uuid ()
        {
            $.get
            (
                configuration.getDocumentRoot () + "/_uuids",
                function (uuids) // {"uuids": ["75480ca477454894678e22eec6002413"]}
                {
                    uuids = JSON.parse (uuids);
                    document.getElementById ("couchdb_uuid").value = uuids.uuids[0];
                }
            );
        }

        function fill_user_data ()
        {
            var username = document.getElementById ("keybase_username").value;
            if (("" != username) && ("" != document.getElementById ("keybase_proxy").innerHTML))
                keybase.lookup
                (
                    username,
                    {
                        success: function (data)
                        {
                            document.getElementById ("picture").innerHTML = "<img src='" + data.them[0].pictures.primary.url + "'>";
                            document.getElementById ("public_key").innerHTML = data.them[0].public_keys.primary.bundle;
                        },
                        error: function ()
                        {
                            document.getElementById ("public_key").innerHTML = "";
                        }
                    }
                );
        }

        /**
         * @summary Initialize the personalization page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @function init
         * @memberOf module:configurator/personalization
         */
        function init ()
        {
            document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
            document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
            get_proxy ();
            get_uuid ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "personalize",
                            title: "Personalization",
                            template: "templates/configurator/personalization.mst",
                            hooks:
                            [
                                { id: "save_personalization", event: "click", code: save, obj: this },
                                { id: "configure_keybase_proxy", event: "click", code: keybase_click, obj: this },
                                { id: "generate_uuid", event: "click", code: create_uuid, obj: this },
                                { id: "keybase_username", event: "changed", code: fill_user_data, obj: this }
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