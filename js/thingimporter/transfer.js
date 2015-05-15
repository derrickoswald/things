/**
 * @fileOverview Transfer things from pending to local database.
 * @name thingimporter/transfer
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../login", "../home", "../configuration"],
    /**
     * @summary Transfer things between the pending database from the import operation to the local database.
     * @name thingimporter/transfer
     * @exports thingimporter/transfer
     * @version 1.0
     */
    function (login, home, configuration)
    {
        var db = configuration.getConfigurationItem ("pending_database");
        var view_name = "Things";

        /**
         * @summary Transfer the given documents to the local database.
         * @description Uses CouchDB replication to replicate the documents
         * given by docs from the pending database into the local database.
         * @param {array} docs list of document SHA1 hash codes as strings
         * @function transfer
         * @memberOf module:thingimporter/transfer
         * @return <em>nothing</em>
         */
        function transfer (docs)
        {
            var list = [];
            docs.forEach (function (item) { list.push (item._id); });
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        $.couch.replicate
                        (
                            db,
                            configuration.getConfigurationItem ("local_database"),
                            {
                                success: function (data)
                                {
                                    console.log (data);
                                    home.delete_document (docs);
                                },
                                error: function (status) { console.log (status); }
                            },
                            {
                                create_target: false,
                                doc_ids: list
                            }
                        );
                    },
                    error: function (userCtx)
                    {
                        alert ("You must be logged in to transfer a thing");
                    }
                }
            );
        }

        /**
         * @summary Initialize the transfer page.
         * @description Sets up the DOM elements for the transfer page
         * by calling home.build_content and home.build_index.
         * @function init
         * @memberOf module:thingimporter/transfer
         * @return <em>nothing</em>
         */
        function init ()
        {
            home.build_content (db, view_name, "listing", { transfer: transfer });
            home.build_index ("right"); // ToDo: how to get page layout here
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
                        transitions: { enter: init, obj: this }
                    });
                }
            }
        );
    }
);
