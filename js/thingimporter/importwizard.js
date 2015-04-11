/**
 * @fileOverview Extension of {@link module:wizard} for importing things.
 * @name thingmaker/importwizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["../page", "wizard", "thingimporter/setup", "thingimporter/transfer", "configuration"],
    /**
     * @summary Import things by setting up the database, setting CouchDb configuration, loading a user script and transferring.
     * @exports thingimporter/importwizard
     * @version 1.0
     */
    function (page, wiz, setup, transfer, configuration)
    {
        /**
         * @summary Create the wizard.
         *
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning import wizard.
         *
         * @function initialize
         */
        function initialize ()
        {
            var steps =
                [
                    { id: "overview", title: "Overview", template: "templates/thingimporter/overview.html"},
                    setup.getStep (), // { id: "setup", title: "Setup", template: "templates/thingimporter/setup.html"},
                    transfer.getStep (),
                ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             * The aim is to have this eventually filled in from user storage.
             * @member
             */
            var data =
            {
                database: configuration.getConfigurationItem ("pending_database"),
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
