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
        }

        /**
         * @summary Remove a file from the list.
         * @description Alter the file list in the data element
         * to remove the one that has a name given by the event target
         * data-file attribute.
         * @param {object} data - the context object for the wizard
         * @param {object} event - the event that triggers this method
         * @function remove_file
         * @memberOf module:thingmaker/files
         */
        function remove_file (data, event)
        {
            var name = event.target.getAttribute ("data-file");
            for (var i = 0; i < data.files.length; i++)
                if (data.files[i].name == name)
                {
                    data.files.splice (i, 1);
                    break;
                }
            update (data);
        }

        /**
         * @summary Update the file list and enable/disable the next button.
         * @function update
         * @memberOf module:thingmaker/files
         * @param {object} data - thingmaker data object
         */
        function update (data)
        {
            // compute the file list
            var total = 0;
            var filelist = [];
            for (var i = 0; data.files && (i < data.files.length); i++)
            {
                filelist.push ({ filename: data.files[i].name, filesize: data.files[i].size, filetype: data.files[i].type });
                // also ??? data.files[i].lastModifiedDate ? data.files[i].lastModifiedDate.toLocaleDateString () : 'n/a'
                total += data.files[i].size;
            }
            // render the file list
            var file_table_template =
                "<thead>" +
                    "<tr><td>Type</td><td>Name</td><td class='right'>Size</td><td class='center'>Remove</td></tr>" +
                "</thead>" +
                "{{#filelist}}" +
                "<tr>" +
                    "<td><img src='../img/file_extension_pdf.png'>{{filetype}}</img></td>" +
                    "<td>{{filename}}</td>" +
                    "<td class='right'>{{filesize}}</td>" +
                    "<td class='center'><span class='glyphicon glyphicon-remove' data-file='{{filename}}'></span></td>" +
                "</tr>" +
                "{{/filelist}}" +
                "{{^filelist}}<tr><td></td><td>No files selected</td><td class='right'></td></tr>{{/filelist}}" +
                "<tfoot>" +
                    "<tr><td></td><td></td><td id='total_size' class='right'>{{total}}</td><td class='center'></td></tr>" +
                "</tfoot>";
            document.getElementById ("file_table").innerHTML = mustache.render
            (
                file_table_template,
                {
                    filelist: filelist,
                    total: total
                }
            );
            // render the directory input box
            if (data.directory)
                document.getElementById ("thing_directory").value = data.directory;
            // toggle visibility
            if (data.files && (0 != data.files.length))
                document.getElementById ("file_table").classList.remove ("hidden");
            else
                document.getElementById ("file_table").classList.add ("hidden");
            // add Contextual backgrounds to the directory input field if it's required
            if (data.files && ((1 < data.files.length) && !data.directory))
                document.getElementById ("directory_group").classList.add ("has-error");
            else
                document.getElementById ("directory_group").classList.remove ("has-error");
            // set the state of the Next button
            if (data.files && ((1 == data.files.length) || ((1 < data.files.length) && data.directory)))
                document.getElementById ("next").removeAttribute ("disabled");
            else
                document.getElementById ("next").setAttribute ("disabled", "disabled");
            // add delete function to each file
            var removes = document.getElementById ("file_table").getElementsByClassName ("glyphicon-remove");
            var remove = remove_file.bind (this, data);
            for (var i = 0; i < removes.length; i++)
                removes[i].addEventListener ("click", remove);
        }

        /**
         * @summary Handler for file change events.
         * @description Add files to the collection and update the display.
         * @param {object} data - the thingmaker wizard data object
         * @param {object} event - the file change event
         * @function file_change
         * @memberOf module:thingmaker/files
         */
        function file_change (data, event)
        {
            add_files (event.target.files, data);
            update (data);
        }

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * adding them to the list of files.
         * @see {module:thingmaker/files.add_files}
         * @param {object} data - the context object for the wizard
         * @param {object} event - the drop event
         * @memberOf module:thingmaker/files
         */
        function file_drop (data, event)
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
         * @param {object} data - the context object for the wizard
         * @param {object} event - the dragover event
         * @memberOf module:thingmaker/files
         */
        function file_drag (data, event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            event.dataTransfer.dropEffect = 'copy';
        }

        /**
         * @summary Event handler for a directory change.
         * @description Attached to the directory input box .
         * @param {object} data - the context object for the wizard
         * @param {object} event - the keyup event
         * @function directory_change
         * @memberOf module:thingmaker/files
         */
        function directory_change (data, event)
        {
            var dir;

            dir = event.target.value;
            dir = dir.trim ();
            if (0 !== dir.length)
                data.directory = dir;
            else
                delete data.directory;
            update (data);
        }

        /**
         * Initialize the page based on the wizard data object.
         * @param {object} data the data object for the thingmaker
         * @param {object} event the tab being shown event
         * @function init
         * @memberOf module:thingmaker/files
         */
        function init (data, event)
        {
            update (data);
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "select_files",
                            title: "Select files",
                            template: "templates/thingmaker/files.mst",
                            hooks:
                            [
                                { id: "thing_files", event: "change", code: file_change, obj: this },
                                { id: "thing_directory", event: "keyup", code: directory_change, obj: this },
                                // drag and drop listeners
                                { id: "files_drop_zone", event: "dragover", code: file_drag, obj: this },
                                { id: "files_drop_zone", event: "drop", code: file_drop, obj: this }
                            ],
                            transitions:
                            {
                                enter: init,
                                obj: this
                            }
                        }
                    );
                }
            }
        );
    }
);
