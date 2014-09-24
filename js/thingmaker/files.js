define
(
    ["mustache"],
    function (mustache)
    {
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

        function ReadFilesAsync (files, data, callback)
        {
            data.files = files;
            Blobs = [];
            Blobs.length = files.length;
            PieceLength = data.piece_length;

            var afterall = function ()
            {
                var length;
                var text;
                text = "";
                length = 0;
                for (var i = 0; i < Blobs.length; i++)
                {
                    text += "file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + " loaded " + Blobs[i].byteLength + " @ " + length + "\n";
                    length += Blobs[i].byteLength;
                }
                text += "length total " + length + "\n";
                // now we have our blobs, build it into one big blob
                var blob = new ArrayBuffer (length);
                var view = new Uint8Array (blob, 0, length);
                length = 0;
                for (var i = 0; i < Blobs.length; i++)
                {
                    view.set (new Uint8Array (Blobs[i], 0, Blobs[i].byteLength), length);
                    length += Blobs[i].byteLength;
                }
                // compute the hashes
                Hashes = new ArrayBuffer (Math.ceil (length / data.piece_length) * 20);
                var hashview = new Uint8Array (Hashes);
                var index = 0;
                for (var j = 0; j < length; j += data.piece_length)
                {
                    var hash = sha1 (blob.slice (j, j + data.piece_length), true);
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
                callback (text);
            };

            var total = 0;
            var filelist = [];
            for (var i = 0; i < files.length; i++)
            {
                //alert ("file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + "\n");
                filelist.push ({ filename: files[i].name, filesize: files[i].size, filetype: files[i].type })
                total += files[i].size;

           //     var reader = new FileReader ();
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
           //     reader.onloadend = makeLoadEndFunction (Blobs, i, afterall);
           //     reader.readAsArrayBuffer (files[i]);
            }
            data.filelist = filelist;
            data.total = total;
            data.filename = function ()
            {
                return (this.name + " xx " + this.size + " yy");
            };
            var file_table_template =
                "{{#filelist}}" +
                "<tr><td><img src=\"../img/file_extension_pdf.png\">{{filetype}}</img></td><td>{{filename}}</td><td class=\"right\">{{filesize}}</td></tr>" +
                "{{/filelist}}" +
                "{{^filelist}}<tr><td><td>No files selected</td><td class=\"right\"></td></tr>{{/filelist}}";
            document.getElementById ("file_table").innerHTML = mustache.render (file_table_template, data);
        };

        function done (data)
        {
            //if (null != Files && (1 == Files.length))
            //    enablebutton ();
            update (data);
        };

        function update (data)
        {
            if (data.files && ((1 == data.files.length) || ((1 < data.files.length) && data.directory)))
                data.next_button.removeAttribute ("disabled");
            else
                data.next_button.setAttribute ("disabled", "disabled");
        }

        // disable the next button
        function disablebutton (button)
        {
            button.setAttribute ("disabled", "disabled");
        };
 

        function file_change (event, data)
        {
            var files;

            files = event.target.files;
            if (0 != files.length)
            {
                var s = "";
                for (var i = 0; i < files.length; i++)
                    s += "file " + i + ": " + files[i].name + " " + files[i].type + " " + files[i].size + "\n";
                ReadFilesAsync (files, data, done);
            }
        };
        
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
                            { id: "thing_directory", event: "keyup", code: directory_change, obj: this }
                        ];
                    return ({ id: "select_files", title: "Select files", template: "templates/files.mst", hooks: select_files_hooks });
                }
            }
        );
    }
)