/**
 * @fileOverview Extension of {@link module:wizard} for searching for things.
 * @name thingsearcher/searchwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../page", "wizard", "configuration", "thingsearcher/search"],
    /**
     * @summary Search for things.
     * @description Use Lucene index to find things with full text search.
     * @name thingsearcher/searchwizard
     * @exports thingsearcher/searchwizard
     * @version 1.0
     */
    function (page, wiz, configuration, search)
    {
        /**
         * @summary Create the wizard.
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning search wizard.
         * @function initialize
         * @memberOf module:thingsearcher/searchwizard
         */
        function initialize ()
        {
            var steps =
            [
                search.getStep ()
            ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             */
            var data =
            {
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
