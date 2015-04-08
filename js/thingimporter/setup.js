define
(
    ["../login", "../configuration"],
    function (login, configuration)
    {
        // check for the existence of the database
        function check_db ()
        {
            // todo: get "pending" database name from configuration
            var dbname = $ ("#database_name").val ();
            function db_list_receiver (list)
            {
                var exists = (-1 != list.indexOf (dbname));
                document.getElementById ("import_database_button").disabled = exists;
                var details = $ ("#import_database_created");
                if (exists)
                    details.removeClass ("hidden")
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

        // make the view
        function make_view ()
        {
            // todo: get "pending" database name from configuration
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

        function make_db ()
        {
            // todo: get "pending" database name from configuration
            configuration.make_database ($ ("#database_name").val (), { success: make_view, error: function () { alert ("database creation failed"); } })
        }

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
                    details.removeClass ("hidden")
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
            )
        }

        function check_thingiverse ()
        {
            var xmlhttp;
            var last;
            var iframe;
            var next;
            var scripted;
            var details;

            // get the current value of ping time
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", "http://localhost:5984/pending_things/ping", true);
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
                        iframe.src = "http://www.thingiverse.com/thing:14504";
                        iframe.style.display = "none";
                        iframe.onload =
                            function (event)
                            {
                                xmlhttp = new XMLHttpRequest ();
                                xmlhttp.open ("GET", "http://localhost:5984/pending_things/ping", true);
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
                                        document.getElementById ("download_user_script_button").disabled = scripted;
                                        details = $ ("#scripted");
                                        if (scripted)
                                            details.removeClass ("hidden")
                                        else
                                            details.addClass ("hidden");

                                        // remove the iframe
                                        document.getElementById ("thingiverse_section").removeChild (iframe);
                                    }
                                }
                                xmlhttp.send ();
                            };
                        document.getElementById ("thingiverse_section").appendChild (iframe);
                    }
                    else
                        document.getElementById ("thingiverse_user_scripted").innerHTML = "false";
            }
            xmlhttp.send ();
        }

        function init ()
        {
            var parameters;

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
                        { id: "import_database_button", event: "click", code: make_db, obj: this },
                        { id: "configure_cors_button", event: "click", code: setup_cors, obj: this }
                    ];
                    return ({ id: "setup", title: "Set up", template: "templates/thingimporter/setup.html", hooks: setup_hooks, transitions: { enter: init, obj: this } });
                }
            }
        );
    }
)