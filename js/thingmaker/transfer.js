/**
 * @fileOverview Transfer things from pending to local database.
 * @name thingmaker/transfer
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../home", "../configuration", "../login", "../page"],
    /**
     * @summary Transfer things between the pending database from the import operation to the local database.
     * @name thingmaker/transfer
     * @exports thingmaker/transfer
     * @version 1.0
     */
    function (home, configuration, login, page)
    {
        /**
         * @summary Delete the given ids (SHA1 hash values) from the database.
         * @description Calls removeDoc for each id.
         * @param {Object[]} docs - list of documents to operate on
         * @param {string} docs[].database - the name of the database the document resides in
         * @param {string} docs[]._id - the document primary key which is a SHA1 hash code
         * @param {string} docs[]._rev - the document revision (current revision when the view was queried)
         * @function delete_document
         * @memberOf module:home
         */
        function delete_document (docs)
        {
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        docs.forEach
                        (
                            function (doc)
                            {
                                $.couch.db (doc.database).removeDoc ({ _id: doc._id, _rev: doc._rev },
                                {
                                    success: function (data)
                                    {
                                        console.log ("Document " + data.id + " revision: " + data.rev + " deleted.");
                                        init ();
                                    },
                                    error: function (status)
                                    {
                                        console.log (status);
                                    }
                                });
                            }
                        );
                    },
                    error: function (userCtx)
                    {
                        alert ("You must be logged in to delete a thing");
                    }
                }
            );
        }

        /**
         * @summary Transfer the given documents to the local database.
         * @description Uses CouchDB replication to replicate the documents
         * given by docs from the pending database into the local database.
         * @param {Object[]} docs - list of documents to operate on
         * @param {string} docs[].database - the name of the database the document resides in
         * @param {string} docs[]._id - the document primary key which is a SHA1 hash code
         * @param {string} docs[]._rev - the document revision (current revision when the view was queried)
         * @function transfer_to_local
         * @memberOf module:home
         * @return <em>nothing</em>
         */
        function transfer_to_local (docs)
        {
            var db;
            var list = docs.map (function (item) { db = item.database; return (item._id); }); // ToDo: generalize to many databases
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
                                    delete_document (docs);
                                    page.draw ();
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
         * by calling home.build_content.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf thingmaker/transfer
         * @return <em>nothing</em>
         */
        function init (event)
        {
            var db = configuration.getConfigurationItem ("pending_database");
            var view_name = "things";

            home.build_content (db, view_name, "pending_listing", { del: delete_document, transfer: transfer_to_local });
        }

        return (
            {
                getStep : function ()
                {
                   return (
                    {
                        id : "transfer",
                        title : "Transfer Things",
                        template : "templates/thingmaker/transfer.mst",
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
