/**
 * @fileOverview CouchDB login.
 * @name login
 * @author Derrick Oswald
 * @version 1.0
 */
define (
    ["mustache"],
    /**
     * @summary Login dialog for CouchDB access.
     * @name login
     * @exports login
     * @version 1.0
     */
    function (mustache)
    {
        var template = "templates/login.mst";
        var ret;

        /**
         * Checks for logged in state.
         * @param {object} options to process the login:
         * success: function(userCtx) to call when the user is logged in
         * error: function to call when a problem occurs or the user is not logged in
         * @return <em>nothing</em>
         * @function isLoggedIn
         * @memberOf module:login
         */
        function isLoggedIn (options)
        {
            options = options || {};
            $.couch.session
            (
                {
                    // {"ok":true,"userCtx":{"name":null,"roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"]}}
                    // {"ok":true,"userCtx":{"name":"admin","roles":["_admin"]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}}
                    success : function (data)
                    {
                        var credentials;

                        if (data.ok)
                            if (data.userCtx.name)
                            {
                                // logged in
                                document.getElementById ("login_button_link").innerHTML = "Logout";
                                if (options.success)
                                    options.success (data.userCtx);
                            }
                            else
                            {
                                // not logged in... see if autologin is enabled
                                credentials = getCredentials ();
                                if (credentials && credentials.autologin)
                                    $.couch.login
                                    (
                                        {
                                            name: credentials.name,
                                            password: credentials.password,
                                            success: function (result) // { ok: true, name: null, roles: Array[1] }, not sure why name is null
                                            {
                                                document.getElementById ("login_button_link").innerHTML = "Logout";
                                                if (options.success)
                                                    options.success ( {name: credentials.username, roles: result.roles });
                                            },
                                            error: function (status)
                                            {
                                                if (options.error)
                                                    options.error (data.userCtx);
                                            }
                                        }
                                    );
                                else
                                    if (options.error)
                                        options.error (data.userCtx);
                            }
                        else
                            if (options.error)
                                options.error (data.userCtx);
                    }
                }
            );
        }

        /**
         * Handler for show.bs.dropdown events.
         * Checks for logged in state and if so performs a logout and bypass opening the dropdown.
         * @param event the dropdown-is-about-to-happen event from the .dropdown list item
         * @function show
         * @memberOf module:login
         */
        function show (event)
        {
            var link = document.getElementById ("login_button_link");
            if ("Logout" == link.innerHTML)
            {
                event.preventDefault ();
                event.stopPropagation ();
                $.couch.logout (
                {
                    success : function (data)
                    {
                        document.getElementById ("login_button_link").innerHTML = "Login";
                    },
                    error : function (status)
                    {
                        console.log (status);
                    }
                });
            }
            else
            {
                var credentials = getCredentials ();
                if (null != credentials)
                {
                    document.getElementById ("username").value = credentials.name;
                    document.getElementById ("password").value = credentials.password;
                    document.getElementById ("remember").checked = true;
                    document.getElementById ("autologin").checked = credentials.autologin;
                }
                else
                    document.getElementById ("remember").checked = false;
            }
        }

        /**
         * Handler for show.bs.dropdown events.
         * Sets focus to the user name text field.
         * @param event the dropdown-has-happened event from the .dropdown list item
         * @function shown
         * @memberOf module:login
         */
        function shown (event)
        {
            document.getElementById ("username").focus ();
        }

        /**
         * Check if local storage is supported.
         * @return <code>true</code> if the browser supports local storage.
         * @function haslLocalStorage
         * @memberOf module:login
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
         * Store the username, password and autologin setting provided by the user in local storage.
         * @function storeCredentials
         * @memberOf module:login
         */
        function storeCredentials (name, password, autologin)
        {
            if (haslLocalStorage ())
            {
                localStorage.setItem ("couchdb_user", name);
                localStorage.setItem ("couchdb_password", password);
                localStorage.setItem ("couchdb_autologin", autologin);
            }
        }

        /**
         * Deletes the username and password from local storage.
         * @function clearCredentials
         * @memberOf module:login
         */
        function clearCredentials ()
        {
            if (haslLocalStorage ())
            {
                localStorage.removeItem ("couchdb_user");
                localStorage.removeItem ("couchdb_password");
                localStorage.removeItem ("couchdb_autologin");
            }
        }

        /**
         * Retrive the username and password from local storage.
         * @return Either <code>null</code> or an object with properties <code>name</code> and <code>password</code>.
         * @function getCredentials
         * @memberOf module:login
         */
        function getCredentials ()
        {
            var name;
            var password;
            var autologin;
            var ret;

            ret = null;

            if (haslLocalStorage ())
            {
                name = localStorage.getItem ("couchdb_user");
                password = localStorage.getItem ("couchdb_password");
                autologin = localStorage.getItem ("couchdb_autologin");
                if ((null != name) || (null != password) || (null != autologin))
                    ret = { name: name, password: password, autologin: autologin };
            }

            return (ret);
        }

        /**
         * Handler for submit events.
         * Performs login and if successful changes the login button text and closes the dropdown,
         * otherwise just displays an alert.
         * @param event the submit-button-pressed event from the .dropdown list item
         * @function submit
         * @memberOf module:login
         */
        function submit (event)
        {
            var username;
            var password;
            var remember;
            var autologin;
            var link;

            event.preventDefault ();
            event.stopPropagation ();

            username = document.getElementById ("username").value;
            password = document.getElementById ("password").value;
            remember = document.getElementById ("remember").checked;
            autologin = document.getElementById ("autologin").checked;
            $.couch.login (
            {
                name: username,
                password: password,
                success: function (data)
                {
                    if (remember)
                        storeCredentials (username, password, autologin);
                    else
                        clearCredentials ();
                    link = document.getElementById ("login_button_link");
                    link.innerHTML = "Logout";
                    $(link).dropdown ("toggle");
                },
                error: function (status)
                {
                    console.log (status);
                    alert ("Login failed.");
                }
            });
        }

        /**
         * Add listeners for the login form.
         * @function hook
         * @memberOf module:login
         */
        function hook ()
        {
            var dropdown;

            dropdown = document.getElementById ("login");
            $ (dropdown).on ("show.bs.dropdown", show);
            $ (dropdown).on ("shown.bs.dropdown", shown);
            $ ("#login_form").on ("submit", submit);
        }

        /**
         * Build the login form.
         * It's assumed to be a drop down on a nav bar, hence a list item.
         * @param id the id of the list to contain the login dropdown
         * @function build
         * @memberOf module:login
         */
        function build (id)
        {
            $.get
            (
                template,
                function (template)
                {
                    var wrapper;

                    wrapper = document.createElement ("ul");
                    wrapper.innerHTML = mustache.render (template);
                    document.getElementById (id).appendChild (wrapper.children[0]);
                    hook ();
                }
            );
        }

        ret =
        {
            "build": build,
            "isLoggedIn": isLoggedIn
        };

        return (ret);
    }
);
