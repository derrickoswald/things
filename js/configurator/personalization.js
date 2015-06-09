/**
 * @fileOverview System personalization step.
 * @name personalization
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
     * @name configurator
     * @exports configurator
     * @version 1.0
     */
    function (configuration, page, mustache, login, database)
    {
        /**
         * @summary Get the current proxies from the CouchDB local configuration.
         * @description Gets all options from the httpd_global_handlers section.
         * @function get_proxies
         * @memberOf module:personalization
         */
        function get_proxies ()
        {
            var keybase = document.getElementById ("keybase_proxy");
            var deluge = document.getElementById ("deluge_proxy");
            keybase.innerHTML = "";
            deluge.innerHTML = "";
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.keybase)
                            keybase.innerHTML = data.keybase;
                        if (data.json)
                            deluge.innerHTML = data.json;
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
         * @memberOf module:personalization
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
         * @memberOf module:personalization
         */
        function create_keybase_proxy (options)
        {
            create_proxy ("keybase", "https://keybase.io", options);
        }

        /**
         * @summary Create the Keybase.io proxy and restart the CouchDB server.
         * @description Event handler for the Keybase button.
         * @function keybase
         * @memberOf module:personalization
         */
        function keybase (event)
        {
            create_keybase_proxy
            (
                {
                    success: function ()
                    {
                        $ ("#restart_required").modal ();
                    }
                }
            );
        }

        /**
         * @summary Create proxy entry for deluge in the CouchDB local configuration.
         * @description Creates an http proxy entry for deluge.
         * @param {object} options - functions for success and error callback
         * @function create_deluge_proxy
         * @memberOf module:personalization
         */
        function create_deluge_proxy (options)
        {
            create_proxy ("json", "http://localhost:8112", options);
        }

        /**
         * @summary Create the deluge proxy and restart the CouchDB server.
         * @description Event handler for the Deluge button.
         * @function deluge
         * @memberOf module:personalization
         */
        function deluge (event)
        {
            create_deluge_proxy
            (
                {
                    success: function ()
                    {
                        $ ("#restart_required").modal ();
                    }
                }
            );
        }

        /**
         * @summary Event handler for the restart CouchDB button.
         * @description Restarts the CouchDB server and closes the dialog box.
         * @function restart
         * @memberOf module:personalization
         */
        function restart (event)
        {
            // issue the HTTP request to restart
            restart_couch
            (
                {
                    success: function ()
                    {
                        console.log ("restart successful");
                        var dialog = document.getElementById ("restart_required");
                        var title = dialog.getElementsByClassName ("modal-title")[0].innerHTML;
                        var body = dialog.getElementsByClassName ("modal-body")[0].innerHTML;
                        dialog.getElementsByClassName ("modal-footer")[0].classList.add ("hidden");
                        dialog.getElementsByClassName ("modal-title")[0].innerHTML = "CouchDB Restarted...";
                        dialog.getElementsByClassName ("modal-body")[0].innerHTML = "Waiting 25...";

                        // wait for couch to come back
                        wait_for_couch
                        (
                            {
                                count: 25,
                                success: function ()
                                {
                                    console.log ("couchdb is back");
                                    // close the modal dialog
                                    $ ("#restart_required").modal ("hide");
                                    // put it back the way it was
                                    dialog.getElementsByClassName ("modal-title")[0].innerHTML = title;
                                    dialog.getElementsByClassName ("modal-body")[0].innerHTML = body;
                                    dialog.getElementsByClassName ("modal-footer")[0].classList.remove ("hidden");
                                    // update the display
                                    get_proxies ();
                                },
                                error: function ()
                                {
                                    console.log ("couchdb is down and out");
                                    // close the modal dialog
                                    $ ("#restart_required").modal ("hide");
                                    // put it back the way it was
                                    dialog.getElementsByClassName ("modal-title")[0].innerHTML = title;
                                    dialog.getElementsByClassName ("modal-body")[0].innerHTML = body;
                                    dialog.getElementsByClassName ("modal-footer")[0].classList.remove ("hidden");
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        console.log ("restart failed");
                    }
                }
            );
        }

        /**
         * @summary Restarts the CouchDB server.
         * @description Calls the /_restart HTTP API. Assumes the user is logged in as an administrator.
         * @function restart_couch
         * @memberOf module:personalization
         */
        function restart_couch (options)
        {
            var url;
            var xmlhttp;

            options = options || {};
            url = configuration.getDocumentRoot () + "/_restart";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", url, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (202 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success ();
                    }
                    else
                        if (options.error)
                            options.error ();
            };
            xmlhttp.send ();
        }

        /**
         * @summary Waits for the CouchDB server.
         * @description Calls the / HTTP API until there is an answer.
         * @function wait_for_couch
         * @memberOf module:personalization
         */
        function wait_for_couch (options)
        {
            var url;
            var xmlhttp;

            options = options || {};
            if ("undefined" == typeof (options.count))
                options.count = 1;
            url = configuration.getDocumentRoot () + "/";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", url, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.timeout = 50;
            xmlhttp.ontimeout = function () // whenever the request times out
            {
                options.count--;
                document.getElementById ("restart_required").getElementsByClassName ("modal-body")[0].innerHTML = "Waiting " + options.count + "...";
                if (0 < options.count)
                    setTimeout (function () { wait_for_couch (options); }, 5000);
                else
                    if (options.error)
                        options.error ();
            },
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success ();
                    }
                    else
                    {
                        options.count--;
                        document.getElementById ("restart_required").getElementsByClassName ("modal-body")[0].innerHTML = "Waiting " + options.count + "...";
                        if (0 < options.count)
                            setTimeout (function () { wait_for_couch (options); }, 5000);
                        else
                            if (options.error)
                                options.error ();
                    }
            };
            xmlhttp.send ();
        }

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator
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
            configuration.setConfigurationItem ("torrent_directory", document.getElementById ("torrent_directory").value.trim ());
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
         * Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @summary Initialize the configurator.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @function init
         * @memberOf module:configurator
         */
        function init ()
        {
            document.getElementById ("torrent_directory").value = configuration.getConfigurationItem ("torrent_directory");
            document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
            document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
            get_proxies ();
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
                                { id: "configure_keybase_proxy", event: "click", code: keybase, obj: this },
                                { id: "configure_deluge_proxy", event: "click", code: deluge, obj: this },
                                { id: "restart", event: "click", code: restart, obj: this }
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