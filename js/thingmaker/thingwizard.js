/**
 * @fileOverview Extension of {@link module:wizard} for creating things.
 * @name thingmaker/thingwizard
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "wizard", "thingmaker/overview", "thingmaker/template", "thingmaker/files", "thingmaker/metadata", "thingmaker/sign", "thingmaker/upload", "thingmaker/publish"],
    /**
     * @summary Create a new thing by specifying the files, template and metadata.
     * @exports thingmaker/thingwizard
     * @version 1.0
     */
    function (configuration, page, wiz, overview, template, files, metadata, sign, upload, publish)
    {
        /**
         * @summary Wizard data.
         * @description The object passed around to maintain state.
         * @memberOf thingmaker/thingwizard
         */
        var data =
        {
            database: configuration.getConfigurationItem ("local_database"),
            piece_length: 16384,
            // files
            // directory
            // thumbnails
            // torrent
        };

        /**
         * @summary Wizard steps.
         * @description The steps in the wizard sequence
         * @memberOf thingmaker/thingwizard
         */
        var steps =
            [
                overview.getStep (),
                template.getStep (),
                files.getStep (),
                metadata.getStep (),
                sign.getStep (),
                upload.getStep (),
                publish.getStep (),
            ];

        /**
         * @summary Create the wizard.
         *
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning thing wizard.
         * @param {number} start - the initial step number
         * @function initialize
         * @memberOf thingmaker/thingwizard
         */
        function initialize (start)
        {
            var areas;

            areas = page.layout ();
            wiz.wizard (areas.left, areas.content, steps, data, start);
        }

        return (
            {
                "data": data,
                "initialize": initialize
            }
        );
    }
);
