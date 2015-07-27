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
                                    code: function (event, data)
                                    {
                                        data.expert = event.target.checked;
                                        configuration.storeProperty ("thingmaker_expert", data.expert.toString ());
                                    }
                                }
                            ],
                            transitions:
                            {
                                enter: function (event, data)
                                {
                                    var expert = configuration.loadProperty ("thingmaker_expert");
                                    if (null != expert)
                                    {
                                        expert = (expert.toLowerCase () === "true");
                                        data.expert = expert;
                                        document.getElementById ("expert").checked = data.expert;
                                    }
                                    else
                                        delete data.expert;
                                },
                                obj: this
                            }
                        }
                    );
                }
            }
        );
    }
);