/**
 * @fileOverview Template selection step of the ThingMaker wizard.
 * @name thingmaker/template
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "torrent"],
    /**
     * @summary Allows selection of a template torrent the file system.
     * @description Reads in a .torrent file as a template to be used for new version creation
     * @name thingmaker/template
     * @exports thingmaker/template
     * @version 1.0
     */
    function (mustache, torrent)
    {
        function update (data)
        {
            document.getElementById ("byte_content").innerHTML = torrent.PrintTorrent (data.torrent);
        }

        function select_template (files, data)
        {
            torrent.ReadTorrentAsync
            (
                files[0],
                {
                    success: function (name, tor)
                    {
                        data.torrent = tor;
                        if (!tor._id && tor.info)
                            tor._id = torrent.InfoHash (tor.info);
                        update (data);
                    }
                }
            );
        }

        /**
         * Handles the file change event.
         */
        function file_change (event, data)
        {
            select_template (event.target.files, data);
        }

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * by triggering the asynchronous reading.
         * @see {module:thingmaker/files.ReadFilesAsync}
         * @param {event} event - the drop event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/template
         */
        function file_drop (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            select_template (event.dataTransfer.files, data);
        }

        /**
         * @summary Event handler for dragging files.
         * @description Attached to the drop target, this handler simply modifies the effect to copy,
         * (which produces the typical hand cursor).
         * @param {event} event - the dragover event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/template
         */
        function file_drag (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            event.dataTransfer.dropEffect = 'copy';
        }

        return (
            {
                getStep: function ()
                {
                    var select_template_hooks =
                        [
                            { id: "thing_template", event: "change", code: file_change, obj: this },
                            // drag and drop listeners
                            { id: "template_drop_zone", event: "dragover", code: file_drag, obj: this },
                            { id: "template_drop_zone", event: "drop", code: file_drop, obj: this }
                        ];
                    return ({ id: "use_template", title: "Use a template", template: "templates/thingmaker/template.mst", hooks: select_template_hooks });
                }
            }
        );
    }
);
