/**
 * @fileOverview File selection step of the ThingMaker wizard.
 * @name thingmaker/files
 * @author Derrick Oswald
 * @version: 1.0
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
         * Creates a function for handling the end of the file reading.
         */
        function makeLoadEndFunction (blobs, index, afterall)
        {
            return function (evt)
            {
                var done;
                if (evt.target.readyState == FileReader.DONE) // DONE == 2
                     blobs[index] = evt.target.result;
                done = true;
                for (var i = 0; i < blobs.length; i++)
                    if (!blobs[i])
                    {
                        done = false;
                        break;
                    }
                if (done)
                    afterall ();
            };
        }

        /**
         * @summary Convert a number into an eight character hexadecimal string.
         * @description Isolates the lowest 8 nibbles of the number one by one and
         * converts them into a hex character, concatenating them into a string.
         * @param {number} val - the value to convert.
         * @returns {string} the equivalent hexadecimal string value of the number with leading zeros (always 8 characters).
         * @memberOf module:thingmaker/files
         */
        function cvt_hex (val)
        {
            var str = "";
            var i;
            var v;

            for (i = 7; i >= 0; i--)
            {
                v = (val >>> (i * 4)) & 0x0f;
                str += v.toString (16);
            }
            return str;
        }

        /**
         * @summary Code for addition of a file to the file set.
         * @description Performs the file read and the accumulation of SH1 values for the pieces.
         * @param {File} file - the file to add
         * @param data - the context object for the wizard
         * @param callback - the function to call when processing is complete
         * @memberOf module:thingmaker/files
         */
        function ReadFileAsync (file, data, callback)
        {
            var reader = new FileReader ();

            // if we use onloadend, we need to check the readyState.
            reader.onloadend = function (evt)
            {
                if (evt.target.readyState == FileReader.DONE) // DONE == 2
                {
                    var length;
                    var text;

                    length = evt.target.result.byteLength;
                    text = "";
                    for (var i = 0; i < length; i += piece_length)
                        text += sha1 (evt.target.result.slice (i, i + piece_length)) + "\n";
                    callback (text);
                }
            };
            reader.readAsArrayBuffer (file);
        };

        /**
         * @summary Common code for addition of files to the file set.
         * @description Performs the reading of files and the accumulation of file data.
         * Specifically it computes the SHA1 values for the pieces of the file set.
         * @param {FileList} files - the list of files to add
         * @param data - the context object for the wizard
         * @param callback - the function to call when processing is complete
         * @memberOf module:thingmaker/files
         */
        function ReadFilesAsync (filesx, data, callback)
        {
            // ToDo: be smarter about re-reading all these files... they could be big
            if (typeof (data.files) == "undefined")
                data.files = [];
            for (var i = 0; i < filesx.length; i++)
                data.files.push (filesx.item (i));
            data.Blobs = [];
            data.Blobs.length = data.files.length;
            PieceLength = data.piece_length;

            var afterall = function ()
            {
                var length;
                var text;
                text = "";
                length = 0;
                for (var i = 0; i < data.Blobs.length; i++)
                {
                    text += "file " + i + ": " + data.files[i].name + " " + data.files[i].type + " " + data.files[i].size + " loaded " + data.Blobs[i].byteLength + " @ " + length + "\n";
                    length += data.Blobs[i].byteLength;
                }
                text += "length total " + length + "\n";
                // now we have our blobs, build it into one big blob
                var blob = new ArrayBuffer (length);
                var view = new Uint8Array (blob, 0, length);
                length = 0;
                for (var i = 0; i < data.Blobs.length; i++)
                {
                    view.set (new Uint8Array (data.Blobs[i], 0, data.Blobs[i].byteLength), length);
                    length += data.Blobs[i].byteLength;
                }
                // compute the hashes
                data.Hashes = new ArrayBuffer (Math.ceil (length / data.piece_length) * 20);
                var hashview = new Uint8Array (data.Hashes);
                var index = 0;
                for (var j = 0; j < length; j += data.piece_length)
                {
                    var hash = sha.sha1 (blob.slice (j, j + data.piece_length), true);
                    var temp = new Uint8Array (hash);
                    for (var k = 0; k < 20; k++)
                        hashview[index++] = temp[k];
                    var raw_text = "";
                    for (var k = 0; k < 5; k++)
                    {
                        var d = 0;
                        for (var l = 0; l < 4; l++)
                            d = (d << 8) + (temp[(k * 4) + l] & 0xff);
                        raw_text += cvt_hex (d);
                    }
                    text += raw_text.toLowerCase () + "\n";
                }
                data.text = text;
                callback (data);
            };

            var total = 0;
            var filelist = [];
            for (var i = 0; i < data.files.length; i++)
            {
                filelist.push ({ filename: data.files[i].name, filesize: data.files[i].size, filetype: data.files[i].type })
                // also ??? data.files[i].lastModifiedDate ? data.files[i].lastModifiedDate.toLocaleDateString () : 'n/a'
                total += data.files[i].size;

                var reader = new FileReader ();
//                onabort
//                Called when the read operation is aborted.
//                onerror
//                Called when an error occurs.
//                onload
//                Called when the read operation is successfully completed.
//                onloadend
//                Called when the read is completed, whether successful or not. This is called after either onload or onerror.
//                onloadstart
//                Called when reading the data is about to begin.
//                onprogress
//                Called periodically while the data is being read.

                // if we use onloadend, we need to check the readyState.
                reader.onloadend = makeLoadEndFunction (data.Blobs, i, afterall);
                reader.readAsArrayBuffer (data.files[i]);
            }
            data.filelist = filelist;
            data.total = total;
            var file_table_template =
                "{{#filelist}}" +
                "<tr><td><img src=\"../img/file_extension_pdf.png\">{{filetype}}</img></td><td>{{filename}}</td><td class=\"right\">{{filesize}}</td></tr>" +
                "{{/filelist}}" +
                "{{^filelist}}<tr><td><td>No files selected</td><td class=\"right\"></td></tr>{{/filelist}}" +
                "{{total}}";
            document.getElementById ("file_table").innerHTML = mustache.render (file_table_template, data);
        };

        function done (data)
        {
            update (data);
        };

        // disable the next button
        function update (data)
        {
            if (data.files && ((1 == data.files.length) || ((1 < data.files.length) && data.directory)))
                data.next_button.removeAttribute ("disabled");
            else
                data.next_button.setAttribute ("disabled", "disabled");
        }

        function file_change (event, data)
        {
            ReadFilesAsync (event.target.files, data, done);
        };

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * by triggering the asynchronous reading.
         * @see {module:thingmaker/files.ReadFilesAsync}
         * @param {event} event - the drop event
         * @param data - the context object for the wizard
         * @memberOf module:thingmaker/files
         */
        function file_drop (event, data)
        {
            var files;

            event.stopPropagation ();
            event.preventDefault ();

            files = event.dataTransfer.files;

            var s = "";
            for (var i = 0; i < files.length; i++)
                s += "file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + "\n";
            alert (s);

            ReadFilesAsync (files, data, done);
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
                            { id: "drop_zone", event: "dragover", code: file_drag, obj: this },
                            { id: "drop_zone", event: "drop", code: file_drop, obj: this }
                        ];
                    return ({ id: "select_files", title: "Select files", template: "templates/files.mst", hooks: select_files_hooks });
                }
            }
        );
    }
)