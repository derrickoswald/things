/**
 * @fileOverview Transfer things from pending to local database.
 * @name thingimporter/transfer
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../home", "../configuration", "../page"],
    /**
     * @summary Transfer things between the pending database from the import operation to the local database.
     * @name thingimporter/transfer
     * @exports thingimporter/transfer
     * @version 1.0
     */
    function (home, configuration, page)
    {
        /**
         * @summary Initialize the transfer page.
         * @description Sets up the DOM elements for the transfer page
         * by calling home.build_content.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:thingimporter/transfer
         * @return <em>nothing</em>
         */
        function init (event)
        {
            var db = configuration.getConfigurationItem ("pending_database");
            var view_name = "Things";

            home.build_content (db, view_name, "listing", { del: home.delete_document, transfer: home.transfer_to_local });
        }

        return (
            {
                getStep : function ()
                {
                   return (
                    {
                        id : "transfer",
                        title : "Transfer Things",
                        template : "templates/thingimporter/transfer.mst",
                        transitions:
                        {
                            enter: init
                        }
                    });
                }
            }
        );
    }
);
