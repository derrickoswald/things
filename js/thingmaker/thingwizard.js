/**
 * @fileOverview Extension of {@link module:wizard} for creating things.
 * @name thingmaker/thingwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "wizard", "thingmaker/files", "thingmaker/template", "thingmaker/make", "thingmaker/upload", "thingmaker/publish"],
    /**
     * @summary Create a new thing by specifying the files, template and metadata.
     * @exports thingmaker/thingwizard
     * @version 1.0
     */
    function (configuration, page, wiz, files, template, make, upload, publish)
    {
        /**
         * @summary Wizard steps.
         * @description The steps in the wizard sequence
         * @memberOf thingwizard
         */
        var steps =
            [
                { id: "overview", title: "Overview", template: "templates/thingmaker/overview.html"},
                files.getStep (), // { id: "select_files", title: "Select files", template: "templates/files.mst", hooks: select_files_hooks },
                template.getStep (), // { id: "use_template", title: "Use a template", template: "templates/thingmaker/template.mst"},
                make.getStep (), // { id: "enter_metadata", title: "Enter metadata", template: "templates/metadata.mst"},
                { id: "sign", title: "Sign the thing", template: "templates/thingmaker/sign.mst"},
                upload.getStep (), // { id: "upload", title: "Upload the thing", template: "templates/upload.mst", hooks: upload_hooks}
                publish.getStep (), // { id: "publish", title: "Publish the thing", template: "templates/publish.mst", hooks: publish_hooks}
            ];

        /**
         * @summary Wizard data.
         * @description The object passed around to maintain state.
         * @memberOf thingwizard
         */
        var data =
        {
            database: configuration.getConfigurationItem ("local_database"),
            piece_length: 16384,
        };

        /**
         * @summary Create the wizard.
         *
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning thing wizard.
         * @param {number} start - the initial step number
         * @function initialize
         */
        function initialize (start)
        {
            var areas;

            areas = page.layout ();
            wiz.wizard (areas.left, areas.content, steps, data, start);
        }

        var functions =
        {
            "steps": steps,
            "data": data,
            "initialize": initialize
        };

        return (functions);
    }
);
