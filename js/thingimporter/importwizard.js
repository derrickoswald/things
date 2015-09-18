/**
 * @fileOverview Extension of {@link module:wizard} for importing things.
 * @name thingimporter/importwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../page", "wizard", "configuration", "thingimporter/userscript", "thingimporter/fetch", "thingmaker/transfer", "thingmaker/publish"],
    /**
     * @summary Import things.
     * @description Imports things from Thingiverse by loading a user script,
     * fetching, transferring and publishing things.
     * @name thingimporter/importwizard
     * @exports thingimporter/importwizard
     * @version 1.0
     */
    function (page, wiz, configuration, userscript, fetch, transfer, publish)
    {
        /**
         * @summary Create the wizard.
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning import wizard.
         * @function initialize
         * @memberOf module:thingimporter/importwizard
         */
        function initialize ()
        {
            var steps =
            [
                { id: "overview", title: "Overview", template: "templates/thingimporter/overview.mst"},
                userscript.getStep (),
                fetch.getStep (),
                transfer.getStep (),
                publish.getStep ()
            ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             */
            var data =
            {
                database: configuration.getConfigurationItem ("pending_database"),
            };

            var areas = page.layout ();
            wiz.wizard (areas.left, areas.content, steps, data);
        }

        var functions =
        {
            "initialize": initialize
        };

        return (functions);
    }
);
