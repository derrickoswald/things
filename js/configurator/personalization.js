/**
 * @fileOverview System personalization step.
 * @name configurator/personalization
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database", "../restart", "../keybase", "../sha1"],
    /**
     * @summary Instance personalization step.
     * @description Sets the identifying information for this instance of the <em>things</em> system.
     * @name configurator/personalization
     * @exports configurator/personalization
     * @version 1.0
     */
    function (configuration, page, mustache, login, database, restart, keybase, sha1)
    {
        var userdata = null;

        /**
         * Show or hide admin elements on the page.
         * @param {boolean} admin - if <code>true</> show the elements with the admin class
         * @function show_hide_admin
         * @memberOf module:configurator/personalization
         */
        function show_hide_admin (admin)
        {
            var elements;

            elements = document.getElementsByClassName ("admin");
            for (var i = 0; i < elements.length; i++)
                if (admin)
                    elements[i].classList.remove ("hidden");
                else
                    elements[i].classList.add ("hidden");
            elements = document.getElementsByClassName ("nonadmin");
            for (var i = 0; i < elements.length; i++)
                if (admin)
                    elements[i].classList.add ("hidden");
                else
                    elements[i].classList.remove ("hidden");
        }

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
                            proxy.innerHTML = data.keybase;
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
         * @param {object} data - the configurator wizard data object, <em>not used</em>
         * @param {object} event - the click event, <em>not used</em>
         * @function keybase_click
         * @memberOf module:configurator/personalization
         */
        function keybase_click (data, event)
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
         * @param {object} data - the configurator wizard data object, <em>not used</em>
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator/personalization
         */
        function save (data, event)
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
         * The uid is either computed from the instance name, user's Keybase name and public key
         * or fetched from CouchDb as the next uuid.
         * @param {object} data - the configurator wizard data object, <em>not used</em>
         * @param {object} event - the click event, <em>not used</em>
         * @function create_uuid
         * @memberOf module:configurator/personalization
         */
        function create_uuid (data, event)
        {
            var instance_name = document.getElementById ("instance_name").value.trim ();
            var keybase_username = document.getElementById ("keybase_username").value.trim ();
            var public_key = "";
            if (null != userdata)
                if (userdata.them[0].public_keys)
                    if (userdata.them[0].public_keys.primary)
                        if (userdata.them[0].public_keys.primary.bundle)
                            public_key = userdata.them[0].public_keys.primary.bundle;
            if (("" != instance_name) && ("" != keybase_username) && ("" != public_key))
            {
                var plaintext =
                    instance_name + "\n" +
                    keybase_username + "\n" +
                    public_key;
                document.getElementById ("couchdb_uuid").value = sha1.sha1 (plaintext, false);
            }
            else
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

        /**
         * @summary Fill in the elements with the Keybase information.
         * @description Fill in full name, location, picture and public key if available.
         * @param {object} data the data object from Keybase
         * @function fill_user_data
         * @memberOf module:configurator/personalization
         */
        function fill_user_data (data)
        {
            document.getElementById ("fullname").innerHTML = "";
            document.getElementById ("location").innerHTML = "";
            document.getElementById ("picture").innerHTML = "";
            document.getElementById ("public_key").innerHTML = "";
            if (null != data)
            {
                if (data.them[0].profile)
                {
                    if (data.them[0].profile.full_name)
                        document.getElementById ("fullname").innerHTML = data.them[0].profile.full_name;
                    if (data.them[0].profile.location)
                        document.getElementById ("location").innerHTML = data.them[0].profile.location;
                }
                if (data.them[0].pictures)
                    if (data.them[0].pictures.primary)
                        if (data.them[0].pictures.primary.url)
                            document.getElementById ("picture").innerHTML = "<img src='" + data.them[0].pictures.primary.url + "'>";
                if (data.them[0].public_keys)
                    if (data.them[0].public_keys.primary)
                        if (data.them[0].public_keys.primary.bundle)
                            document.getElementById ("public_key").innerHTML = "<pre>" + data.them[0].public_keys.primary.bundle + "</pre>";
            }
        }

        /**
         * @summary Get the Keybase information for the current user.
         * @description Query the Keybase lookup API with the keybase_username.
         * @param {object} data - the configurator wizard data object, <em>not used</em>
         * @param {object} event - the event that triggered the lookup.
         * @function get_user_data
         * @memberOf module:configurator/personalization
         */
        function get_user_data (data, event)
        {
            var username = document.getElementById ("keybase_username").value;
            if ("" != username)
                keybase.lookup
                (
                    username,
                    {
                        success: function (data)
                        {
                            userdata = null;
                            if (data.them)
                                if (Array.isArray (data.them))
                                    if (0 != data.them.length && (null != data.them[0]))
                                        userdata = data;
                            fill_user_data (userdata);
                        },
                        error: function ()
                        {
                            userdata = null;
                            fill_user_data (userdata);
                        }
                    }
                );
            else
            {
                userdata = null;
                fill_user_data (userdata);
            }
        }

        /**
         * @summary Initialize the personalization page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @param {object} data the data object for the configurator
         * @param {object} event the tab being shown event
         * @function init
         * @memberOf module:configurator/personalization
         */
        function init (data, event)
        {
            var admin;

            document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
            document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
            admin = -1 != data.roles.indexOf ("_admin")
            if (admin)
                get_proxy ();
            get_user_data ();
            get_uuid ();
            show_hide_admin (admin);
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
                                { id: "keybase_username", event: "input", code: get_user_data, obj: this }
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