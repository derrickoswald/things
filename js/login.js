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
     * @description Handles the UI for login/logout as well as local storage if requested,
     * and raises login/logout events.
     * @name login
     * @exports login
     * @version 1.0
     */
    function (mustache)
    {
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

                        if (data.ok) // logged in
                            if (data.userCtx.name)
                            {
                                menu_adjust (true);
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
                                                menu_adjust (true);
                                                if (options.success)
                                                    options.success ( {name: credentials.username, roles: result.roles });
                                                // let registered listeners know about the login
                                                _login.trigger ("login");
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
         * Checks for logged in state and if so performs a logout and bypasses opening the dropdown.
         * @param event the dropdown-is-about-to-happen event from the .dropdown list item
         * @function show
         * @memberOf module:login
         */
        function show (event)
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
                if (null != autologin)
                    autologin = JSON.parse (autologin.toLowerCase ());
                if ((null != name) || (null != password) || (null != autologin))
                    ret = { name: name, password: password, autologin: autologin };
            }

            return (ret);
        }

        /**
         * @summary Handler for submit events.
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
         * @summary Swap menu items.
         * Change the menu from Login to Logout or vice versa.
         * @param {boolean} logged_in If <em>true</em>, make it say logout, otherwise make it say login.
         * @function menu_adjust
         * @memberOf module:login
         */
        function menu_adjust (logged_in)
        {
            if (logged_in)
            {
                // hide the login item
                document.getElementById ("login").classList.add ("hidden");
                // show the logout item
                document.getElementById ("logout").classList.remove ("hidden");
            }
            else
            {
                // hide the logout item
                document.getElementById ("logout").classList.add ("hidden");
                // show the login item
                document.getElementById ("login").classList.remove ("hidden");
            }
        }

        /**
         * @summary Do the CouchDb login.
         * Performs login and if successful remembers the credentials if required,
         * closes the dropdown, changes the menu and notifies listeners;
         * otherwise just displays an alert of failure.
         * @param {object} credentials The username, password, and autologin request as a plain object.
         * @param {boolean} remember If true, store the credentials if possible.
         * @function do_login
         * @memberOf module:login
         */
        function do_login (credentials, remember)
        {
            // try login
            $.couch.login (
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
                    $(document.getElementById ("login_button_link")).dropdown ("toggle");
                    // fix the menu
                    menu_adjust (true);
                    // let registered listeners know about the login
                    _login.trigger ("login");
                },
                error: function (status)
                {
                    console.log (status);
                    alert ("Login failed.");
                }
            });

        }

        /**
         * @summary Do the CouchDb logout.
         * Performs logout and if successful changes the menu and notifies listeners;
         * otherwise just displays an alert of failure.
         * @param {object} credentials The username, password, and autologin request as a plain object.
         * @param {boolean} remember If true, store the credentials if possible.
         * @function do_logout
         * @memberOf module:login
         */
        function do_logout ()
        {
            var credentials;

            credentials = getCredentials ();
            if (null != credentials) // the user really wants to logout, so reset autologin
                storeCredentials (credentials.name, credentials.password, false);
            $.couch.logout
            (
                {
                    success : function (data)
                    {
                        // fix the menu
                        menu_adjust (false);
                        // let registered listeners know about the logout
                        _login.trigger ("logout");
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
                    document.getElementById ("logout_button_link").onclick = do_logout;
                }
            );
        }

        var _login = $.eventable
        (
            {
                "build": build,
                "isLoggedIn": isLoggedIn
            }
        );
        return (_login);
    }
);
