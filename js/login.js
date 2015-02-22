/**
 * @fileOverview CouchDB login.
 * @name login
 * @author Derrick Oswald
 * @version: 1.0
 */
define (
    ["mustache"],
    function (mustache)
    {
        var template = "templates/login.mst";

        /**
         * Checks for logged in state by examining the text in the login dropdown link.
         * NOTE: this won't handle timeouts and other issues, but is real quick and dirty.
         * @return <code>true</code> is the user is logged in as far as we can tell.
         */
        function isLoggedIn ()
        {
            var link = document.getElementById ("login_button_link");
            return ("Logout" == link.innerHTML);
        }

        /**
         * Handler for show.bs.dropdown events.
         * Checks for logged in state and if so perorms a logout and bypass opening the dropdown.
         * @param event the dropdown-is-about-to-happen event from the .dropdown list item
         */
        function show (event)
        {
            if (isLoggedIn ())
            {
                event.preventDefault ();
                event.stopPropagation ();
                $.couch.logout (
                {
                    success : function (data)
                    {
                        console.log (data);
                        var link = document.getElementById ("login_button_link");
                        link.innerHTML = "Login";
                    },
                    error : function (status)
                    {
                        console.log (status);
                    }
                });
            }
        }

        /**
         * Handler for show.bs.dropdown events.
         * Sets focus to the user name text field.
         * @param event the dropdown-has-happened event from the .dropdown list item
         */
        function shown (event)
        {
            var username = document.getElementById ("username");
            username.focus ();
        }

        /**
         * Handler for submit events.
         * Performs login and if successful changes the login button text and closes the dropdown,
         * otherwise just displays an alert.
         * @param event the submit-button-pressed event from the .dropdown list item
         */
        function submit (event)
        {
            event.preventDefault ();
            event.stopPropagation ();
            var username = document.getElementById ("username");
            var password = document.getElementById ("password");
            $.couch.login (
            {
                name : username.value,
                password : password.value,
                success : function (data)
                {
                    console.log (data);
                    var link = document.getElementById ("login_button_link");
                    link.innerHTML = "Logout";
                    $(link).dropdown ('toggle');
                },
                error : function (status)
                {
                    console.log (status);
                    alert ("Login failed.");
                }
            });
        }

        /**
         * Add listeners for the login form.
         */
        function hook ()
        {
            var dropdown = document.getElementById ("login");
            $ (dropdown).on ('show.bs.dropdown', show);
            $ (dropdown).on ('shown.bs.dropdown', shown);
            var form = document.getElementById ("login_form");
            $ (form).on ('submit', submit);
        }

        /**
         * Build the login form.
         * It's assumed to be a drop down on a nav bar, hence a list item.
         * @param id the id of the list to contain the login dropdown
         */
        function build (id)
        {
            var list = document.getElementById (id);
            $.get
            (
                template,
                function (template)
                {
                    var wrapper = document.createElement ('ul');
                    var text = mustache.render (template);
                    wrapper.innerHTML = text;
                    list.appendChild (wrapper.children[0]);
                    hook ();
                }
            );
        }

        var functions =
        {
            "build": build,
            "isLoggedIn": isLoggedIn
        }

        return (functions);
    }
)
