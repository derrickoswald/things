/**
 * @fileOverview Extension of {@link module:wizard} for configuring the system.
 * @name configurator/configwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["page", "wizard", "configuration", "configurator/databases", "configurator/personalization", "configurator/import"],
    /**
     * @summary Set up the system with one-time or custom configuration.
     * @description Step by step configuration of the system.
     * @name configurator/configwizard
     * @exports configurator/configwizard
     * @version 1.0
     */
    function (page, wiz, configuration, databases, personalization, imp) // note: "import" is a keyword or something, so "imp" it is
    {
        /**
         * @summary Create the wizard.
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning configuration wizard.
         * @function initialize
         * @memberOf module:configurator/configwizard
         */
        function initialize ()
        {
            var steps =
            [
                databases.getStep (),
                personalization.getStep (),
                imp.getStep ()
            ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             */
            var data =
            {
                // everything is in the configuration database
            };

            var areas = page.layout ();
            wiz.wizard (areas.left, areas.content, steps, data);
        };

        var functions =
        {
            "initialize": initialize
        };

        return (functions);
    }
);
