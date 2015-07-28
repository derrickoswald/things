/**
 * @fileOverview Upload thing to CouchDB.
 * @name upload
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    // ToDo: check for conflicting object already uploaded
    ["mustache", "../records", "../bencoder", "../login", "../configuration", "../torrent"],
    /**
     * @summary Upload a thing to the local database.
     * @description Creates the document for a thing in the public database.
     * @name thingmaker/upload
     * @exports thingmaker/upload
     * @version 1.0
     */
    function (mustache, records, bencoder, login, configuration, torrent)
    {
        /**
         * @summary Upload to the public database.
         * @description Upload a thing to the public database.
         * @param {object} data - the ThingMaker data object
         * @param {object} event - the button push event
         * @return <em>nothing</em>
         * @see http://www.bittorrent.org/beps/bep_0019.html
         * @function upload
         * @memberOf module:thingmaker/upload
         */
        function upload (data, event)
        {
            event.preventDefault ();

            if (data.torrent)
                login.isLoggedIn
                (
                    {
                        success: function (userCtx)
                        {
                            var primary_key = data.torrent._id;

                            // convert the pieces into an array (CouchDB doesn't store ArrayBuffers)
                            data.torrent.info.pieces = torrent.PiecesToArray (data.torrent.info.pieces);

                            if (typeof (data.files) == "undefined")
                                data.files = [];
                            if (typeof (data.images) == "undefined")
                                data.images = [];

                            // make the list of files for attachment with names adjusted for directory
                            var copy = [];
                            data.files.forEach
                            (
                                function (item)
                                {
                                    if (1 < data.files.length)
                                        copy.push (new File ([item], data.torrent.info.name + "/" + item.name, { type: item.type, lastModifiedDate: item.lastModifiedDate }));
                                    else
                                        copy.push (item);
                                }
                            );

                            // add the torrent to the copy of the list of files to be saved
                            copy.push (new File ([bencoder.str2ab (bencoder.encode (data.torrent))], primary_key + ".torrent", { type: "application/octet-stream" }));

                            // add images to the list of files to be saved
                            copy = copy.concat (data.images);

                            records.saveDocWithAttachments.call
                            (
                                records,
                                data.database,
                                data.torrent,
                                {
                                    success: function (result)
                                    {
                                        console.log (result);
                                        // remove added _rev field for now
                                        delete data.torrent._rev;
                                        // put the pieces back
                                        data.torrent.info.pieces = torrent.ArrayToPieces (data.torrent.info.pieces);
                                        alert ("upload succeeded");
                                    },
                                    error: function (result)
                                    {
                                        console.log (result);
                                        // put the pieces back
                                        data.torrent.info.pieces = torrent.ArrayToPieces (data.torrent.info.pieces);
                                        alert ("upload failed");
                                    }
                                },
                                copy
                            );
                        },
                        error: function (userCtx)
                        {
                            alert ("You must be logged in to make a thing");
                        }
                    }
                );
            else
                alert ("You must make a thing first before uploading");

        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "upload",
                            title: "Upload the thing",
                            template: "templates/thingmaker/upload.mst",
                            hooks:
                            [
                                { id: "upload_button", event: "click", code: upload, obj: this }
                            ]
                        }
                    );
                }
            }
        );
    }
);
