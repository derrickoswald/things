/**
 * @fileOverview Initial setup for importing things.
 * @name thingimporter/setup
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../login", "../configuration"],
    /**
     * @summary Perform setup operations for the thingimporter.
     * @name thingimporter/setup
     * @exports thingimporter/setup
     * @version 1.0
     */
    function (login, configuration)
    {
        var pending = configuration.getConfigurationItem ("pending_database");

        /**
         * Check for the existence of the database.
         * @memberOf module:thingimporter/setup
         */
        function check_db ()
        {
            var dbname = $ ("#database_name").val ();
            function db_list_receiver (list)
            {
                var exists = (-1 != list.indexOf (dbname));
                document.getElementById ("create_import_database_button").disabled = exists;
                var details = $ ("#import_database_created");
                if (exists)
                    details.removeClass ("hidden");
                else
                    details.addClass ("hidden");
            }
            $.couch.allDbs
            (
                {
                    success: db_list_receiver
                }
            );
        }

        /**
         * Make the view.
         * @memberOf module:thingimporter/setup
         */
        function make_view ()
        {
            configuration.make_designdoc
            (
                $ ("#database_name").val (),
                {
                    success: check_db,
                    error: function () { alert ("make view failed"); }
                },
                true
            );
        }

        /**
         * Make the database.
         * @memberOf module:thingimporter/setup
         */
        function make_db ()
        {
            configuration.make_database ($ ("#database_name").val (), { success: make_view, error: function () { alert ("database creation failed"); } });
        }

        /**
         * Check that CORS is set up accordingly.
         * @memberOf module:thingimporter/setup
         */
        function check_CORS ()
        {
            function configuration_receiver (configuration)
            {
                var cors_enabled = configuration.httpd.enable_cors;
                var methods = configuration.cors.methods;
                var origins = configuration.cors.origins;
                var cors = (cors_enabled && (-1 != methods.indexOf ("PUT")) && (-1 != origins.indexOf ("thingiverse.com")));
                document.getElementById ("cors_enabled").innerHTML = (cors_enabled ? "true" : "false");
                document.getElementById ("cors_methods").innerHTML = methods;
                document.getElementById ("cors_origins").innerHTML = origins;
                document.getElementById ("configure_cors_button").disabled = cors;
                var details = $ ("#cors_configured");
                if (cors)
                    details.removeClass ("hidden");
                else
                    details.addClass ("hidden");

            };
            function problem (status)
            {
                alert ("problem " + status);
            }
            $.couch.config
            (
                {
                    success: configuration_receiver
                }
            );
        }

        /**
         * Turn on CORS support.
         * @memberOf module:thingimporter/setup
         */
        function enable_cors (options)
        {
            $.couch.config
            (
                options,
                "httpd",
                "enable_cors",
                "true"
            );
        }

        /**
         * Set up CORS methods.
         * @memberOf module:thingimporter/setup
         */
        function set_methods (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "methods",
                "GET,POST,PUT"
            );
        }

        /**
         * Set up CORS origins.
         * @memberOf module:thingimporter/setup
         */
        function set_origins (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "origins",
                "http://www.thingiverse.com"
            );
        }

        /**
         * Set up CORS support for http://thingiverse.com.
         * @memberOf module:thingimporter/setup
         */
        function setup_cors ()
        {
            enable_cors
            (
                {
                    success: function ()
                    {
                        set_methods
                        (
                            {
                                success: function ()
                                {
                                    set_origins
                                    (
                                        {
                                            success: function () { alert ("Restart CouchDB for changes to take effect"); check_CORS (); },
                                            error: function () { alert ("Allowing http://www.thingiverse.com as an origin failed"); check_CORS (); }
                                        }
                                    );
                                },
                                error: function () { alert ("Setting methods failed"); check_CORS (); }
                            }
                        );
                    },
                    error: function () { alert ("Enabling CORS failed"); }
                }
            );
        }

        /**
         * Check if the user script is set up for thingiverse.com.
         * @memberOf module:thingimporter/setup
         */
        function check_thingiverse ()
        {
            var ping;
            var xmlhttp;
            var last;
            var iframe;
            var next;
            var scripted;
            var details;

            // get the current value of ping time
            ping = configuration.getDocumentRoot () + "/" +
                configuration.getConfigurationItem ("pending_database") +
                "/ping";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", ping, true);
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status  || 404 == xmlhttp.status)
                    {
                        if (404 != xmlhttp.status)
                            last = new Date (JSON.parse (xmlhttp.responseText).time);
                        else
                            last = new Date ();

                        // inject the iframe into the page, wait for render complete
                        iframe = document.createElement ("iframe");
                        iframe.id = "thingiverse";
                        iframe.src = "http://www.thingiverse.com/thing:796123";
                        iframe.style.display = "none";
                        iframe.onload =
                            function (event)
                            {
                                xmlhttp = new XMLHttpRequest ();
                                xmlhttp.open ("GET", ping, true);
                                xmlhttp.setRequestHeader ("Accept", "application/json");
                                xmlhttp.onreadystatechange = function ()
                                {
                                    if (4 == xmlhttp.readyState)
                                    {
                                        scripted = false;
                                        if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
                                        {
                                            next = new Date (JSON.parse (xmlhttp.responseText).time);
                                            scripted = (last.valueOf () != next.valueOf ());
                                        }
                                        document.getElementById ("thingiverse_user_scripted").innerHTML = (scripted ? "true" : "false");
                                        details = $ ("#scripted");
                                        if (scripted)
                                            details.removeClass ("hidden");
                                        else
                                            details.addClass ("hidden");

                                        // remove the iframe
                                        document.getElementById ("thingiverse_section").removeChild (iframe);
                                    }
                                };
                                xmlhttp.send ();
                            };
                        document.getElementById ("thingiverse_section").appendChild (iframe);
                    }
                    else
                        document.getElementById ("thingiverse_user_scripted").innerHTML = "false";
            };
            xmlhttp.send ();
        }

        /**
         * Edit the user script according to the current configuration.
         * @memberOf module:thingimporter/setup
         */
        function customize_user_script (text)
        {
            var ret;

            // ToDo: protocol
            // ToDo: more surgical editing
            ret = text.replace ("localhost", location.hostname);
            ret = ret.replace ("5984", location.port);
            ret = ret.replace ("pending_things", configuration.getConfigurationItem ("pending_database"));
            ret = ret.replace ("prefix = \"\"", "prefix = \"" + $.couch.urlPrefix + "\"");

            return (ret);
        }

        /**
         * Set up the "download user script" button.
         * @memberOf module:thingimporter/setup
         */
        function prepare_user_script ()
        {
            var script;
            var xmlhttp;
            var text;
            var a;

            // get the user script
            script = configuration.getDocumentRoot () + "/" +
                "things/_design/things/js/thingimporter/thingiverse_thing_capture_greasemonkey_script.user.js";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", script, true);
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        text = xmlhttp.responseText;
                        text = customize_user_script (text);
                        text = encodeURIComponent (text);
                        text = unescape (text);
                        text = btoa (text);
                        a = document.getElementById ('script_link');
                        a.setAttribute ("href", "data:application/octet-stream;base64," + text);
                        a.setAttribute ("download", "thingiverse_thing_capture_greasemonkey_script.user.js");
                    }
                    else
                        alert ("user script " + script + " not found");
            };
            xmlhttp.send ();
        }

        /**
         * Initialize the thingimporter setup page.
         * @memberOf module:thingimporter/setup
         */
        function init (event, data)
        {
            var parameters;

            // set the pending database name
            $ ("#database_name").val (pending);
            // set up the download script button
            prepare_user_script ();
            parameters =
            {
                success: function ()
                {
                    check_db ();
                    check_CORS ();
                    check_thingiverse ();
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        return (
            {
                getStep: function ()
                {
                    var setup_hooks =
                    [
                        { id: "create_import_database_button", event: "click", code: make_db, obj: this },
                        { id: "configure_cors_button", event: "click", code: setup_cors, obj: this }
                    ];
                    return ({ id: "setup", title: "Set up", template: "templates/thingimporter/setup.html", hooks: setup_hooks, transitions: { enter: init, obj: this } });
                }
            }
        );
    }
);