These instructions are fairly rough and haven't been tried out on a virgin machine, but this is pretty much what you need to do to contribute to or develop code for ***things***.

-   Install git.

-   Install eclipse.

-   Add the jsTestDriver plugin described at https://code.google.com/p/js-test-driver/wiki/UsingTheEclipsePlugin.

-   Configure browser startup commands in the jsTestDriver properties and open the jsTestDriver window under Javascript.

-   Install couchdb from http://couchdb.apache.org/ and test that futon can access it (after a reboot on Windows) at http://localhost:5984/\_utils/index.html.

-   Install erica as described at https://github.com/benoitc/erica (some issues with current git repo, so use prebuilt binaries). The project assumes linux and that erica can be found in /usr/local/bin/erica.

-   Install deluge and deluge-web. Enable the web interface under WebUI in preferences.

-   Clone the things project found at https://github.com/derrickoswald/things.

-   Import the project into eclipse (don't copy into workspace).

-   Windows users will need to change the command line for the "erica push to couchdb" builder to C:\\Program Files (x86)\\Apache Software Foundation\\CouchDB\\bin\\erica.cmd or wherever you placed it.

-   All users will need to modify the build variables for \${couchdb\_admin}, \${couchdb\_password}, \${couchdb\_host} and \${couchdb\_port}.

-   Add a "run configuration" for jsTestDriver for the project to run every save.

-   Install JsDoc as described at http://usejsdoc.org.

-   Build the project. On the first build (and after a clean) it will ask you for the couchdb admin password. This should push it to the local couchdb.

-   Browse to http://localhost:5984/things/\_design/things/\_rewrite/ and it will detect there is no configuration database, and take you to the configurator.

-   Follow the steps outlined in the configurator


