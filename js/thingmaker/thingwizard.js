/**
 * @fileOverview Extension of {@link module:wizard} for creating things.
 * @name thingmaker/thingwizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["wizard", "thingmaker/files", "thingmaker/make", "thingmaker/upload"],
    /**
     * @summary Create a new thing by specifying the files, template and metadata.
     * @exports thingmaker/thingwizard
     * @version 1.0
     */
    function (wiz, files, make, upload)
    {
        /**
         * @summary Create the wizard.
         *
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning thing wizard.
         * 
         * @function initialize
         */ 
        function initialize ()
        {
            var steps =
                [
                    { id: "overview", title: "Overview", template: "templates/overview.html"},
                    files.getStep (), // { id: "select_files", title: "Select files", template: "templates/files.mst", hooks: select_files_hooks },
                    { id: "use_template", title: "Use a template", template: "templates/template.mst"},
                    make.getStep (), // { id: "enter_metadata", title: "Enter metadata", template: "templates/metadata.mst"},
                    { id: "sign", title: "Sign the thing", template: "templates/sign.mst"},
                    upload.getStep (), // { id: "upload", title: "Upload the thing", template: "templates/upload.mst", hooks: upload_hooks}
                    { id: "publish", title: "Publish the thing", template: "templates/publish.mst"}
                ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state. The aim is to have this eventually filled in from user storage.
             * @member
             */ 
            var data =
            {
                database: "things",
                piece_length: 16384,
            };
     
            var row;
            var nav;
            var content;
            var stream;
            var main;
            
            row = document.createElement ("div");
            row.id = "main_area";
            row.className = "row";

            nav = document.createElement ("ul");
            row.appendChild (nav);
            nav.className = "col-md-3 nav nav-tabs nav-stacked";
            nav.setAttribute ("role", "tablist");
            nav.id = "sidebar";

            content = document.createElement ("div");
            row.appendChild (content);
            content.className = "col-md-6 tab-content";
            content.id = "panes";

            wiz.wizard (nav, content, steps, data);

            stream = document.createElement ("div");
            row.appendChild (stream);
            stream.className = "col-md-3";
            stream.id = "stream";

            main = document.getElementById ("main");
            while (main.firstChild)
                main.removeChild (main.firstChild);
            main.appendChild (row);
        };
        
        var functions =
        {
            "initialize": initialize
        };
        
        return (functions);
    }
);

