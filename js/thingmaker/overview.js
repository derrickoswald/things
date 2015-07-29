/**
 * @fileOverview Initial overview step of the ThingMaker wizard.
 * @name thingmaker/overview
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration"],
    /**
     * @summary Introduce users to the thingmaker.
     * @description Provides a high level overview of the process for making a thing.
     * @name thingmaker/overview
     * @exports thingmaker/overview
     * @version 1.0
     */
    function (configuration)
    {
        /**
         * Form initialization function.
         *
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:thingmaker/overview
         */
        function init (event)
        {
            var ex = configuration.loadProperty ("thingmaker_expert");
            if (null != ex)
            {
                this.expert = (ex.toLowerCase () === "true");
                document.getElementById ("expert").checked = this.expert;
            }
            else
                delete this.expert;
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "overview",
                            title: "Overview",
                            template: "templates/thingmaker/overview.mst",
                            hooks:
                            [
                                {
                                    id: "expert",
                                    event: "change",
                                    code: function (event)
                                    {
                                        this.expert = event.target.checked;
                                        configuration.storeProperty ("thingmaker_expert", this.expert.toString ());
                                    }
                                }
                            ],
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                }
            }
        );
    }
);