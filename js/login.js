/**
 * @fileOverview CouchDB login.
 * @name login
 * @author Derrick Oswald
 * @version 1.0
 */
define (
    ["mustache", "configuration"],
    /**
     * @summary Login dialog for CouchDB access.
     * @description Handles the UI for login/logout as well as local storage if requested,
     * and raises login/logout events.
     * @name login
     * @exports login
     * @version 1.0
     */
    function (mustache, configuration)
    {
        /**
         * Checks for logged in state.
         * @param {object} options to process the login:
         * success: function({name: yadda, roles: [yadda, yadda]}) to call when the user is logged in
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
                    // {"ok":true,"userCtx":{"name":"derrick","roles":["user"]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}}
                    success: function (data)
                    {
                        var credentials;

                        if (data.ok)
                            if (data.userCtx.name) // logged in
                            {
                                menu_adjust (data.userCtx.name);
                                if (options.success)
                                    options.success ({ name: data.userCtx.name, roles: data.userCtx.roles });
                            }
                            else // not logged in...
                            {
                                // check for Admin Party
                                if (-1 != data.userCtx.roles.indexOf ("_admin"))
                                {
                                    if (options.success)
                                        options.success ({ name: data.userCtx.name, roles: data.userCtx.roles });
                                }
                                else
                                {
                                    // see if autologin is enabled
                                    credentials = getCredentials ();
                                    if (credentials && credentials.autologin)
                                        $.couch.login
                                        (
                                            {
                                                name: credentials.name,
                                                password: credentials.password,
                                                success: function (result)
                                                {
                                                    delete result.ok;
                                                    menu_adjust (result.name);
                                                    if (options.success)
                                                        options.success (result);
                                                    // reset the application
                                                    reinitialize ("login", result);
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
         * Checks for logged in state and if so performs a logout and bypasses opening the dropdown.
         * @param event the dropdown-is-about-to-happen event from the .dropdown list item
         * @function show
         * @memberOf module:login
         */
        function show (event)
        {
            var credentials = getCredentials ();
            if (null !== credentials)
            {
                document.getElementById ("username").value = credentials.name;
                document.getElementById ("password").value = credentials.password;
                document.getElementById ("remember").checked = true;
                document.getElementById ("autologin").checked = credentials.autologin;
            }
            else
            {
                document.getElementById ("username").value = "";
                document.getElementById ("password").value = "";
                document.getElementById ("remember").checked = false;
                document.getElementById ("autologin").checked = false;
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
                ret = (("localStorage" in window) && (null !== window["localStorage"]));
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
         * Retrieve the username and password from local storage.
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
                if (null !== autologin)
                    autologin = JSON.parse (autologin.toLowerCase ());
                if ((null !== name) || (null !== password) || (null !== autologin))
                    ret = { name: name, password: password, autologin: autologin };
            }

            return (ret);
        }

        /**
         * @summary Handler for login submit events.
         * @param {object} event - the submit-button-pressed event from the .dropdown list item
         * @function submit
         * @memberOf module:login
         */
        function submit (event)
        {
            var username;
            var password;
            var remember;
            var autologin;

            event.preventDefault ();
            event.stopPropagation ();

            // retrieve the form values
            username = document.getElementById ("username").value;
            password = document.getElementById ("password").value;
            remember = document.getElementById ("remember").checked;
            autologin = document.getElementById ("autologin").checked;

            // clear the form
            document.getElementById ("username").value = "";
            document.getElementById ("password").value = "";
            document.getElementById ("remember").checked = false;
            document.getElementById ("autologin").checked = false;

            // do the login
            do_login ({username: username, password: password, autologin: autologin}, remember);
        }

        /**
         * @summary Handler for create submit events.
         * @param {object} event - the submit-button-pressed event from the .dropdown list item
         * @function create
         * @memberOf module:login
         */
        function create (event)
        {
            var username;
            var password1;
            var password2;

            event.preventDefault ();
            event.stopPropagation ();

            // retrieve the form values
            username = document.getElementById ("newuser").value;
            password1 = document.getElementById ("password1").value;
            password2 = document.getElementById ("password2").value;

            if (password1 == password2)
                // create the user
                do_create ({ username: username, password: password1 });
            else
                alert ("password fields are not the same, please re-enter them");
        }

        /**
         * @summary Swap menu items.
         * Change the menu from Login to Logout or vice versa.
         * @param {string} user - logged in user, if <code>undefined</code> or <code>null</code> make it say login.
         * @function menu_adjust
         * @memberOf module:login
         */
        function menu_adjust (user)
        {
            if (user)
            {
                // hide the login item
                document.getElementById ("login").classList.add ("hidden");
                // show the logout item
                document.getElementById ("logout").classList.remove ("hidden");
                // show the user name
                document.getElementById ("loggedin_user").innerHTML = user;
            }
            else
            {
                // hide the logout item
                document.getElementById ("logout").classList.add ("hidden");
                // show the login item
                document.getElementById ("login").classList.remove ("hidden");
                // clear the user name
                document.getElementById ("loggedin_user").innerHTML = "";
            }
        }

        function dummy () // just here so Eclipse's brain dead outline mode works
        {
        }

        /**
         * @summary Restart the application as a different user.
         * @description Fixes up the configuration as the new user and issues the login/logout notification.
         * @param {string} notification - the event to trigger
         * @param {any} data - data to pass with notification
         * @function reinitialize
         * @memberOf module:login
         */
        function reinitialize (notification, data)
        {
            function notify ()
            {
                // let registered listeners know about the login/logout
                _login.trigger (notification, data);
            };
            // setup configuration to agree with current user
            configuration.configuration_setup
            (
                {
                    success: notify,
                    error: notify
                }
            );

        }

        /**
         * @summary Do the CouchDb login.
         * @description Performs login and if successful remembers the credentials if required,
         * closes the dropdown, changes the menu and notifies listeners;
         * otherwise just displays an alert of failure.
         * @param {object} credentials - the username, password, and autologin request as a plain object
         * @param {boolean} remember - if true, store the credentials if possible
         * @function do_login
         * @memberOf module:login
         */
        function do_login (credentials, remember)
        {
            // try login
            $.couch.login
            (
                {
                    name: credentials.username,
                    password: credentials.password,
                    success: function (data)
                    {
                        if (remember)
                            storeCredentials (credentials.username, credentials.password, credentials.autologin);
                        else
                            clearCredentials ();
                        // close the dropdown
                        $ ("#login_button_link").dropdown ("toggle");
                        // fix the menu
                        menu_adjust (credentials.username);
                        // reset the application
                        reinitialize ("login", data);
                    },
                    error: function (status)
                    {
                        console.log (status);
                        alert ("Login failed.");
                    }
                }
            );
        }

        /**
         * @summary Create the user.
         * Calls the user_manager process to create the new user.
         * @param {object} credentials - the username, and password as a plain object
         * @function do_create
         * @memberOf module:login
         */
        function do_create (credentials)
        {
            var url;
            var xmlhttp;

            url = configuration.getDocumentRoot () + "/user_manager/" +
                "?username=" + encodeURIComponent (credentials.username) +
                "&password=" + encodeURIComponent (credentials.password);
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", url, true);
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        // clear the form
                        document.getElementById ("newuser").value = "";
                        document.getElementById ("password1").value = "";
                        document.getElementById ("password2").value = "";
                        // close the dropdown
                        $ ("#create_user_link").dropdown ("toggle");
                        alert ("Account " + credentials.username + " created");
                    }
                    else
                        alert ("Could not create account '" + credentials.username +
                               "' because of error: " + xmlhttp.status +
                               " " + xmlhttp.responseText);
            };
            xmlhttp.send ();
        }

        function dummmy () // just here so Eclipse's brain dead outline mode works
        {
        }

        /**
         * @summary Do the CouchDb logout.
         * Performs logout and if successful changes the menu and notifies listeners;
         * otherwise just displays an alert of failure.
         * @param {object} event - the logout button click event
         * @function do_logout
         * @memberOf module:login
         */
        function do_logout (event)
        {
            var credentials;

            event.preventDefault ();
            event.stopPropagation ();
            credentials = getCredentials ();
            if (null !== credentials) // the user really wants to logout, so reset autologin
                storeCredentials (credentials.name, credentials.password, false);
            $.couch.logout
            (
                {
                    success : function ()
                    {
                        // fix the menu
                        menu_adjust (null);
                        // reset the application
                        reinitialize ("logout");
                    },
                    error : function (status)
                    {
                        console.log (status);
                        alert ("Logout failed.");
                    }
                }
            );
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
                "templates/login.mst",
                function (template)
                {
                    var wrapper;
                    var dropdown;

                    wrapper = document.createElement ("ul");
                    wrapper.innerHTML = mustache.render (template);
                    var l = wrapper.children.length;
                    for (var i = 0; i < l; i++)
                        document.getElementById (id).appendChild (wrapper.children[0]); // yes, zero
                    dropdown = document.getElementById ("login");
                    $ (dropdown).on ("show.bs.dropdown", show);
                    $ (dropdown).on ("shown.bs.dropdown", shown);
                    $ ("#login_form").on ("submit", submit);
                    $ ("#create_user_form").on ("submit", create);
                    document.getElementById ("logout_button_link").onclick = do_logout;
                }
            );
        }

        var _login = $.eventable
        (
            {
                build: build,
                isLoggedIn: isLoggedIn
            }
        );
        return (_login);
    }
);
