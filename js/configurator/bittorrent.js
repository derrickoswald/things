/**
 * @fileOverview BitTorrent configuration step.
 * @name bittorrent
 * @author Derrick Oswald
 * @version 1.0
 */
define ([ "../configuration", "../page", "../mustache", "../login", "./restart" ],
/**
 * @summary BitTorrent setup page.
 * @description Configure download directory, host, port and password for Deluge.
 * @name bittorrent
 * @exports bittorrent
 * @version 1.0
 */
function (configuration, page, mustache, login, restart)
{
    /**
     * @summary Save button event handler.
     * @description Saves the form values as the current configuration document.
     * @param {object} event - the save button press event
     * @function save
     * @memberOf module:configurator/bittorrent
     */
    function save (event)
    {
        event.preventDefault ();
        event.stopPropagation ();

        configuration.setConfigurationItem ("deluge_password", document.getElementById ("deluge_password").value.trim ());
        configuration.setConfigurationItem ("torrent_directory", document.getElementById ("torrent_directory").value.trim ());
        configuration.setConfigurationItem ("deluge_couch_url", document.getElementById ("deluge_couch_url").value.trim ());
        configuration.saveConfiguration
        (
            {
                success : function (data)
                {
                    console.log (data);
                    alert ("Configuration saved.");
                },
                error : function (status)
                {
                    console.log (status);
                    alert ("Configuration save failed.");
                }
            }
        );
    }

    /**
     * @summary Initialize the bittorrent page of the configurator wizard.
     * @description Fills the form with existing configuration data and attaches
     *              handlers for the various operations.
     * @param {object} event - the tab being shown event, <em>not used</em>
     * @function init
     * @memberOf module:configurator/bittorrent
     */
    function init (event)
    {
        document.getElementById ("deluge_password").value = configuration.getConfigurationItem ("deluge_password");
        document.getElementById ("torrent_directory").value = configuration.getConfigurationItem ("torrent_directory");
        document.getElementById ("deluge_couch_url").value = configuration.getConfigurationItem ("deluge_couch_url");
    }

    return (
    {
        getStep : function ()
        {
            return (
            {
                id : "bittorent",
                title : "BitTorrent",
                template : "templates/configurator/bittorrent.mst",
                hooks : [
                {
                    id : "save_bittorrent",
                    event : "click",
                    code : save
                } ],
                transitions :
                {
                    enter : init
                }
            });
        }
    });
});