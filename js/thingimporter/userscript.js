/**
 * @fileOverview Install the user script in the browser.
 * @name thingimporter/userscript
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../login", "../configuration"],
    /**
     * @summary Create, download (but not install) and test the user script.
     * @name thingimporter/userscript
     * @exports thingimporter/userscript
     * @version 1.0
     */
    function (login, configuration)
    {
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

        function get_script (name, options)
        {
            var script;

            options = options || {};
            script = configuration.getDocumentRoot () +
                "/things/_design/things/" + name;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", script, true);
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success (xmlhttp.responseText);
                    }
                    else
                    {
                        if (options.error)
                            options.error ();
                    }

            };
            xmlhttp.send ();
        }

        function replace_placeholders (text, options)
        {
            var regexp;
            var match;
            var javascript;

            regexp = /("%%.*%%")/;
            match = regexp.exec (text);
            if (match)
            {
                javascript = match[0].substring (3, match[0].length - 3);
                get_script
                (
                    javascript,
                    {
                        success: function (script)
                        {
                            var newtext;

                            newtext = text.replace (match[0], script);
                            replace_placeholders (newtext, options); // recursive
                        },
                        error: function ()
                        {
                            if (options.error)
                                options.error ();
                        }

                    }
                );
            }
            else
                if (options.success)
                    options.success (text);
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
            get_script
            (
                "js/thingimporter/thingiverse_import.user.js",
                {
                    success: function (text)
                    {
                        text = customize_user_script (text);
                        replace_placeholders
                        (
                            text,
                            {
                                success: function (text)
                                {
                                    text = encodeURIComponent (text);
                                    text = unescape (text);
                                    text = btoa (text);
                                    a = document.getElementById ('script_link');
                                    a.setAttribute ("href", "data:application/octet-stream;base64," + text);
                                    a.setAttribute ("download", "thingiverse_import.user.js");
                                },
                                error: function ()
                                {
                                    alert ("failed to generate user script");
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        alert ("user script " + script + " not found");
                    }
                }
            );
        }


        /**
         * @summary Initialize the user script installation page.
         * @description Creates the download artifact and optionally tests the installation.
         * @function init
         * @memberOf module:thingimporter/userscript
         * @return <em>nothing</em>
         */
        function init ()
        {
            // set up the download script button
            prepare_user_script ();
        }

        return (
            {
                getStep : function ()
                {
                   return (
                    {
                        id : "userscript",
                        title : "Install User Script",
                        template : "templates/thingimporter/userscript.mst",
                        hooks:
                        [
                            { id: "test_user_script_button", event: "click", code: check_thingiverse, obj: this }
                        ],
                        transitions: { enter: init, obj: this }
                    });
                }
            }
        );
    }
);
