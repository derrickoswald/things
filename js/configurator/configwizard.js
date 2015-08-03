/**
 * @fileOverview Extension of {@link module:wizard} for configuring the system.
 * @name configurator/configwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["page", "wizard", "configuration", "login", "mustache", "configurator/databases", "configurator/personalization", "configurator/import", "configurator/bittorrent"],
    /**
     * @summary Set up the system with one-time or custom configuration.
     * @description Step by step configuration of the system.
     * @name configurator/configwizard
     * @exports configurator/configwizard
     * @version 1.0
     */
    function (page, wiz, configuration, login, mustache, databases, personalization, imp, bittorrent) // note: "import" is a keyword or something, so "imp" it is
    {
        // register for login/logout events
        login.on
        (
            "login",
            function ()
            {
                // if Configuration is the active page, re-initialize
                if (document.getElementById ("configurator").parentElement.classList.contains ("active"))
                    initialize ();
            }
        );
        login.on
        (
            "logout",
            function ()
            {
                // if Configuration is the active page, re-initialize
                if (document.getElementById ("configurator").parentElement.classList.contains ("active"))
                    initialize ();
            }
        );

        /**
         * @summary Create the wizard.
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning configuration wizard.
         * @function initialize
         * @memberOf module:configurator/configwizard
         */
        function initialize ()
        {
            var areas;

            areas = page.layout ();
            login.isLoggedIn
            (
                {
                    success: function (context)
                    {
                        wiz.wizard
                        (
                            areas.left,
                            areas.content,
                            [
                                personalization.getStep (),
                                databases.getStep (),
                                imp.getStep (),
                                bittorrent.getStep ()
                            ],
                            context
                        );

                    },
                    error: function ()
                    {
                        //alert ("You must be logged in to do configuration.");
                        $.get
                        (
                            "templates/configurator/introduction.mst",
                            function (template)
                            {
                                areas.content.innerHTML = mustache.render (template);
                            }
                        );
                    }
                }
            );
        };

        var functions =
        {
            "initialize": initialize
        };

        return (functions);
    }
);
