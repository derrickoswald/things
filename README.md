things
======

Thing Tracker Network experimentation.

#Developer Instructions
These instructions are fairly rough and haven't been tried out on a virgin machine, but this is pretty much what you need to do to contribute to or develop code for **_things_**.
* Install git.
* Install eclipse.
* Add the jsTestDriver plugin described at https://code.google.com/p/js-test-driver/wiki/UsingTheEclipsePlugin.
* Configure browser startup commands in the jsTestDriver properties and open the jsTestDriver window under Javascript.
* Install couchdb from http://couchdb.apache.org/ and test that futon can access it (after a reboot on Windows) at http://localhost:5984/_utils/index.html.
* Add the following lines to the local configuration (use command couchdb -c in order to see where the local configuration file is, on linux it's /etc/couchdb/local.ini) under the [httpd_global_handlers] section (which initially has a commented out google proxy):
  * keybase = {couch_httpd_proxy, handle_proxy_req, <<"https://keybase.io/">>}
  * json = {couch_httpd_proxy, handle_proxy_req, <<"http://localhost:8112">>}
* Install erica as described at https://github.com/benoitc/erica (some issues with current git repo, so use prebuilt binaries). The project assumes linux and that erica can be found in /usr/local/bin/erica.
* Install deluge and deluge-web. Enable the web interface under WebUI in preferences.
* Clone the things project found at https://github.com/derrickoswald/things.
* Import the project into eclipse (don't copy into workspace).
* Windows users will need to change the command line for the "erica push to couchdb" builder to C:\Program Files (x86)\Apache Software Foundation\CouchDB\bin\erica.cmd or wherever you placed it.
* All users will need to modify the build variables for ${couchdb_admin}, ${couchdb_password}, ${couchdb_host} and ${couchdb_port}.
* Add a "run configuration" for jsTestDriver for the project to run every save.
* Build the project. This should push it to the local couchdb and run the unit tests.
