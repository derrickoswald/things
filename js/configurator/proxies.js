/**
 * @fileOverview Proxy and daemon configuration step.
 * @name configurator/proxies
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database", "../restart", "../keybase", "../sha1"],
    /**
     * @summary Proxy and daemon configuration step.
     * @description Sets up proxies and daemon entries in the CouchDB configuration file.
     * @name configurator/proxies
     * @exports configurator/proxies
     * @version 1.0
     */
    function (configuration, page, mustache, login, database, restart, keybase, sha1)
    {
        /**
         * @summary Extracts the URL out of the proxy setting.
         * @description Gets the 'https://keybase.io' out of '{couch_httpd_proxy, handle_proxy_req, <<"https://keybase.io">>}'.
         * @parameter {string} str - the raw proxy entry from the configuration .ini file.
         * @return {string} the URL for the proxy.
         * @function parse_proxy
         * @memberOf module:configurator/proxies
         */
        function parse_proxy (str)
        {
            var regexp;
            var matches;
            var ret;

            regexp = /{couch_httpd_proxy, handle_proxy_req, <<\"([^\"]*)\">>}/;
            matches = str.match (regexp);
            if (matches)
                ret = matches[1]; // index 0 is the entire match
            else
                ret = str;

            return (ret);
        }

        /**
         * @summary Get the current proxies from the CouchDB local configuration.
         * @description Gets the httpd_global_handlers section and populates the form.
         * @function get_proxies
         * @memberOf module:configurator/proxies
         */
        function get_proxies ()
        {
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.keybase)
                            document.getElementById ("keybase_proxy").value = parse_proxy (data.keybase);
                        if (data.json)
                            document.getElementById ("deluge_proxy").value = parse_proxy (data.json);
                        if (data.user_manager)
                            document.getElementById ("user_manager_proxy").value = parse_proxy (data.user_manager);
                        if (data._fti)
                            document.getElementById ("fti_proxy").value = parse_proxy (data._fti);
                    },
                },
                "httpd_global_handlers"
            );
        }

        /**
         * @summary Create a proxy entry.
         * @description Creates an http proxy entry for the provided name and url.
         * @param {string} name - the name of the proxy, i.e. how it is called by the client.
         * @param {string} url - the URL that the proxy redirects to.
         * @param {object} options - functions for success and error callback
         * @function set_proxy
         * @memberOf module:configurator/proxies
         */
        function set_proxy (name, url, options)
        {
            if (url && ("" == url.trim ()))
                url = null; // DELETE
            else if (url)
                url = "{couch_httpd_proxy, handle_proxy_req, <<\"" + url + "\">>}";
            $.couch.config
            (
                options,
                "httpd_global_handlers",
                name,
                url
            );
        }

        /**
         * @summary Create proxy entry for keybase.io in the CouchDB local configuration.
         * @description Creates an http proxy entry for keybase.io.
         * @param {object} options - functions for success and error callback
         * @function create_keybase_proxy
         * @memberOf module:configurator/proxies
         */
        function create_keybase_proxy (options)
        {
            set_proxy ("keybase", document.getElementById ("keybase_proxy").value, options);
        }

        /**
         * @summary Create proxy entry for deluge in the CouchDB local configuration.
         * @description Creates an http proxy entry for deluge.
         * @param {object} options - functions for success and error callback
         * @function create_deluge_proxy
         * @memberOf module:configurator/proxies
         */
        function create_deluge_proxy (options)
        {
            set_proxy ("json", document.getElementById ("deluge_proxy").value, options);
        }

        /**
         * @summary Create proxy entry for user_manager in the CouchDB local configuration.
         * @description Creates an http proxy entry for user_manager.
         * @param {object} options - functions for success and error callback
         * @function create_user_manager_proxy
         * @memberOf module:configurator/proxies
         */
        function create_user_manager_proxy (options)
        {
            set_proxy ("user_manager", document.getElementById ("user_manager_proxy").value, options);
        }

        /**
         * @summary Create proxy entry for full text index in the CouchDB local configuration.
         * @description Creates an http proxy entry for _fti.
         * @param {object} options - functions for success and error callback
         * @function create_fti_proxy
         * @memberOf module:configurator/proxies
         */
        function create_fti_proxy (options)
        {
            set_proxy ("_fti", document.getElementById ("fti_proxy").value, options);
        }

        /**
         * @summary Extracts the command out of the daemon setting.
         * @description Gets the /usr/bin/node /root/user_manager.js' out of 'user_manager = /usr/bin/node /root/user_manager.js'.
         * @parameter {string} str - the raw daemon entry from the configuration .ini file.
         * @return {string} the command for the daemon.
         * @function parse_daemon
         * @memberOf module:configurator/proxies
         */
        function parse_daemon (str)
        {
            var regexp;
            var matches;
            var ret;

            regexp = /.*=\s*(.*)$/;
            matches = str.match (regexp);
            if (matches)
                ret = matches[1]; // index 0 is the entire match
            else
                ret = str;

            return (ret);
        }

        /**
         * @summary Get the current daemons from the CouchDB local configuration.
         * @description Gets the os_daemons section and populates the form.
         * @function get_daemons
         * @memberOf module:configurator/proxies
         */
        function get_daemons ()
        {
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.user_manager)
                            document.getElementById ("user_manager_daemon").value = parse_daemon (data.user_manager);
                        if (data.couchdb_lucene)
                            document.getElementById ("fti_daemon").value = parse_daemon (data.couchdb_lucene);
                    },
                },
                "os_daemons"
            );
        }
        /**
         * @summary Create a daemon entry.
         * @description Creates an os daemons entry for the provided command.
         * @param {string} name - the name of the daemon.
         * @param {string} command - the os command needed to start the program.
         * @param {object} options - functions for success and error callback
         * @function set_daemon
         * @memberOf module:configurator/proxies
         */
        function set_daemon (name, command, options)
        {
            if (command && ("" == command.trim ()))
                command = null; // DELETE
            $.couch.config
            (
                options,
                "os_daemons",
                name,
                command
            );
        }

        /**
         * @summary Create user_manager daemon entry in the CouchDB local configuration.
         * @description Creates daemon entry for user_manager.
         * @param {object} options - functions for success and error callback
         * @function create_user_manager_daemon
         * @memberOf module:configurator/proxies
         */
        function create_user_manager_daemon (options)
        {
            set_daemon ("user_manager", document.getElementById ("user_manager_daemon").value, options);
        }

        /**
         * @summary Create full text index daemon entry in the CouchDB local configuration.
         * @description Creates daemon entry for couchdb_lucene.
         * @param {object} options - functions for success and error callback
         * @function create_fti_daemon
         * @memberOf module:configurator/proxies
         */
        function create_fti_daemon (options)
        {
            set_daemon ("couchdb_lucene", document.getElementById ("fti_daemon").value, options);
        }

        /**
         * @summary Set up secret.
         * @description Check and ensure, proxy_use_secret is set to true and the secret is a uuid.
         * @param {object} options - functions for success and error callback
         * @function set_secret
         * @memberOf module:configurator/proxies
         */
        function set_secret (options)
        {
//[couch_httpd_auth]
//...
//secret = 3c675b1f39d2a51ae9f1910b2052d151
//proxy_use_secret = true
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (!data.secret || !data.proxy_use_secret || "true" != data.proxy_use_secret)
                            $.get
                            (
                                configuration.getDocumentRoot () + "/_uuids",
                                function (uuids)
                                {
                                    var uuid;

                                    uuids = JSON.parse (uuids);
                                    uuid = uuids.uuids[0];
                                    $.couch.config
                                    (
                                        {
                                            success: function ()
                                            {
                                                $.couch.config
                                                (
                                                    options,
                                                    "couch_httpd_auth",
                                                    "proxy_use_secret",
                                                    "true"
                                                );
                                            },
                                            error: options.error
                                        },
                                        "couch_httpd_auth",
                                        "secret",
                                        uuid
                                    );
                                }
                            );
                        else
                            if (options.success)
                                options.success ();
                    },
                    error: options.error
                },
                "couch_httpd_auth"
            );
        }

        /**
         * @summary Set up proxy_authentication_handler.
         * @description Add the proxy authentication method to the authentication handlers.
         * @param {object} options - functions for success and error callback
         * @function set_proxy_auth
         * @memberOf module:configurator/proxies
         */
        function set_proxy_auth (options)
        {
            //[httpd]
            //...
            //authentication_handlers = {couch_httpd_oauth, oauth_authentication_handler}, {couch_httpd_auth, cookie_authentication_handler}, {couch_httpd_auth, default_authentication_handler}
            $.couch.config
            (
                {
                    success: function (data) // "{couch_httpd_oauth, oauth_authentication_handler}, {couch_httpd_auth, cookie_authentication_handler}, {couch_httpd_auth, default_authentication_handler}"
                    {
                        var trigger;

                        trigger = /proxy_authentication_handler/;
                        if (!data.match (trigger))
                            $.couch.config
                            (
                                options,
                                "httpd",
                                "authentication_handlers",
                                data + ", {couch_httpd_auth, proxy_authentication_handler}"
                            );
                        else
                            if (options.success)
                                options.success ();
                    },
                    error: options.error
                },
                "httpd",
                "authentication_handlers"
            );
        }

        /**
         * @summary Set up proxy_authentication_handler.
         * @description Extract the port from the URL for the user_manager proxy.
         * @return {number} the port number, or the default of 8000 if none was specified
         * @function get_user_manager_port
         * @memberOf module:configurator/proxies
         */
        function get_user_manager_port ()
        {
            var proxy_port;
            var matches;
            var ret;

            ret = 8000;

            proxy_port = document.getElementById ("user_manager_proxy").value; // http://localhost:8000
            matches = proxy_port.match (/.*\:(\d*)$/);
            if (matches)
                ret = Number (matches[1]);

            return (ret);
        }

        /**
         * @summary Delete the password item from the user_manager options.
         * @description Remove the 'user_manager/password' item in the configuration.
         * @param {object} options - functions for success and error callback
         * @function delete_user_manager_password
         * @memberOf module:configurator/proxies
         */
        function delete_user_manager_password (options)
        {
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.password)
                            $.couch.config
                            (
                                {
                                    success: function ()
                                    {
                                        if (options.success)
                                            options.success ();
                                    },
                                    error: options.error
                                },
                                "user_manager",
                                "password",
                                null
                            );
                        else
                            if (options.success)
                                options.success ();
                    },
                    error: options.error
                },
                "user_manager"
            );
        }

        /**
         * @summary Set up the user_manager options.
         * @description Add or update the 'user_manager' section in the configuration.
         * @param {object} options - functions for success and error callback
         * @function set_user_manager_configuration
         * @memberOf module:configurator/proxies
         */
        function set_user_manager_configuration (options)
        {
            //[user_manager]
            //listen_port = 8000
            //couchdb = http://localhost:5984
            //username = admin
            //userrole = _admin

            var listen_port;
            var couchdb;
            var username;
            var userrole;

            login.isLoggedIn
            (
                {
                    success: function (data) // { name: "admin", roles: ["_admin"] }
                    {
                        listen_port = get_user_manager_port ();
                        couchdb = configuration.getDocumentRoot ();
                        username = data.name;
                        if (-1 == data.roles.indexOf ("_admin"))
                            alert ("user '" + username + "' must be assigned the '_admin' role");
                        userrole = "_admin";
                        $.couch.config
                        (
                            {
                                success: function ()
                                {
                                    $.couch.config
                                    (
                                        {
                                            success: function ()
                                            {
                                                $.couch.config
                                                (
                                                    {
                                                        success: function ()
                                                        {
                                                            $.couch.config
                                                            (
                                                                {
                                                                    success: function ()
                                                                    {
                                                                        delete_user_manager_password (options)
                                                                    },
                                                                    error: options.error
                                                                },
                                                                "user_manager",
                                                                "userrole",
                                                                userrole
                                                            );
                                                        },
                                                        error: options.error
                                                    },
                                                    "user_manager",
                                                    "username",
                                                    username
                                                );
                                            },
                                            error: options.error
                                        },
                                        "user_manager",
                                        "couchdb",
                                        couchdb
                                    );
                                },
                                error: options.error
                            },
                            "user_manager",
                            "listen_port",
                            String (listen_port)
                        );
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Update the proxy entries in the CouchDB local configuration.
         * @description Sets the configuration values for proxies.
         * @param {object} event - the button click event, <em>not used</em>
         * @function save
         * @memberOf module:configurator/proxies
         */
        function save (event)
        {
            var context = [0, 0];
            var options = { success: init }; // update the display
            var success = function ()
            {
                if (9 == ++context[0] + context[1])
                    if (0 != context[0])
                        restart.inject (options);
            };
            var error = function ()
            {
                alert ("a save step failed");
                if (9 == context[0] + ++context[1])
                    if (0 != context[0])
                        restart.inject (options);
            };
            var callbacks = { success: success, error: error };
            create_keybase_proxy (callbacks); // 1)
            create_deluge_proxy (callbacks); // 2)
            create_user_manager_proxy (callbacks); // 3)
            create_fti_proxy (callbacks); // 4)
            create_user_manager_daemon (callbacks); // 5)
            create_fti_daemon (callbacks); // 6)
            set_proxy_auth (callbacks); // 7)
            set_secret (callbacks); // 8)
            set_user_manager_configuration (callbacks); // 9)
        }

        /**
         * @summary Initialize the proxies page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:configurator/proxies
         */
        function init (event)
        {
            get_proxies ();
            get_daemons ();
        }

        // ToDo: execute javascript from within the CouchDb:
        // $ /usr/bin/node --eval 'http = require ("http"); http.get ("http://swirl:5984/js/about.js", function (result) { result.on ("data", function (chunk) { console.log (chunk); }); });'
        // <Buffer 2f 2a 2a 0a 20 2a 20 40 66 69 6c 65 4f 76 65 72 76 69 65 77 20 54 68 69 6e 67 20 73 69 67 6e 69 6e 67 20 73 74 65 70 20 6f 66 20 74 68 65 20 54 68 69 6e ...>

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "proxies",
                            title: "Proxies and Daemons",
                            template: "templates/configurator/proxies.mst",
                            hooks:
                            [
                                { id: "save_proxies", event: "click", code: save }
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
