/**
 * @fileOverview Extension of {@link module:wizard} for creating things.
 * @name thingmaker/thingwizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["wizard", "../home", "thingmaker/files", "thingmaker/make", "thingmaker/upload", "thingmaker/publish"],
    /**
     * @summary Create a new thing by specifying the files, template and metadata.
     * @exports thingmaker/thingwizard
     * @version 1.0
     */
    function (wiz, home, files, make, upload, publish)
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
                    publish.getStep (), // { id: "publish", title: "Publish the thing", template: "templates/publish.mst", hooks: publish_hooks}
                ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             * The aim is to have this eventually filled in from user storage.
             * @member
             */
            var data =
            {
                database: "things",
                piece_length: 16384,
            };

            var areas = home.layout ();

            wiz.wizard (areas.left, areas.content, steps, data);
        };

        var functions =
        {
            "initialize": initialize
        };

        return (functions);
    }
);

