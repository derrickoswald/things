/**
 * @fileOverview File selection step of the ThingMaker wizard.
 * @name thingmaker/files
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "sha1"],
    /**
     * @summary Allows user selection of files from the file system.
     * @description Presents a list of files to which the user can add and remove files
     * selected from the file system. Allows either native file selection dialog via button activation
     * or drag and drop onto this wizard page.
     * This code also generates the SHA1 values (used in the torrent creation) from the contents of the files.
     * @name thingmaker/files
     * @exports thingmaker/files
     * @version 1.0
     */
    function (mustache, sha)
    {
        /**
         * @summary Add files to the list.
         * @description Creates the file list if necessary and adds the
         * given files to the list.
         * @param {FileList} files - the files dropped or selected by the user
         * @param {object} data - the context object for the wizard
         * @function add_files
         * @memberOf module:thingmaker/files
         */
        function add_files (files, data)
        {
            if (typeof (data.files) == "undefined")
                data.files = [];
            for (var i = 0; i < files.length; i++)
                data.files.push (files.item (i));
        };

        /**
         * @summary Update the file list and enable/disable the next button.
         * @function update
         * @memberOf module:thingmaker/files
         * @param {object} data thinkmaker data object
         */
        function update (data)
        {
            var total = 0;
            var filelist = [];
            for (var i = 0; i < data.files.length; i++)
            {
                filelist.push ({ filename: data.files[i].name, filesize: data.files[i].size, filetype: data.files[i].type })
                // also ??? data.files[i].lastModifiedDate ? data.files[i].lastModifiedDate.toLocaleDateString () : 'n/a'
                total += data.files[i].size;
            }

            var file_table_template =
                "{{#filelist}}" +
                "<tr><td><img src=\"../img/file_extension_pdf.png\">{{filetype}}</img></td><td>{{filename}}</td><td class=\"right\">{{filesize}}</td></tr>" +
                "{{/filelist}}" +
                "{{^filelist}}<tr><td><td>No files selected</td><td class=\"right\"></td></tr>{{/filelist}}" +
                "{{total}}";
            document.getElementById ("file_table").innerHTML = mustache.render (file_table_template, { filelist: filelist, total: total });

            if (data.files && ((1 == data.files.length) || ((1 < data.files.length) && data.directory)))
                data.next_button.removeAttribute ("disabled");
            else
                data.next_button.setAttribute ("disabled", "disabled");
        }

        function file_change (event, data)
        {
            add_files (event.target.files, data);
            update (data);
        };

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * adding them to the list of files.
         * @see {module:thingmaker/files.add_files}
         * @param {event} event - the drop event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/files
         */
        function file_drop (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            add_files (event.dataTransfer.files, data);
            update (data);
        }

        /**
         * @summary Event handler for dragging files.
         * @description Attached to the drop target, this handler simply modifies the effect to copy,
         * (which produces the typical hand cursor).
         * @param {event} event - the dragover event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/files
         */
        function file_drag (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            event.dataTransfer.dropEffect = 'copy';
        }

        /**
         * @summary Event handler for a directory change.
         * @description Attached to the directory input box .
         * @param {event} event - the keyup event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/files
         */
        function directory_change (event, data)
        {
            var dir;

            dir = event.target.value;
            dir = dir.trim ();
            if (0 != dir.length)
                data.directory = dir;
            else
                delete data.directory;
            update (data);
        };

        return (
            {
                getStep: function ()
                {
                    var select_files_hooks =
                        [
                            { id: "thing_files", event: "change", code: file_change, obj: this },
                            { id: "thing_directory", event: "keyup", code: directory_change, obj: this },
                            // drag and drop listeners
                            { id: "files_drop_zone", event: "dragover", code: file_drag, obj: this },
                            { id: "files_drop_zone", event: "drop", code: file_drop, obj: this }
                        ];
                    return ({ id: "select_files", title: "Select files", template: "templates/thingmaker/files.mst", hooks: select_files_hooks });
                }
            }
        );
    }
)