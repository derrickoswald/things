#!/bin/bash

# start the CouchDB service
echo "Starting CouchDB"
/usr/local/bin/couchdb -b
while ! nc -vz localhost 5984; do sleep 1; done

# replicate things database from http://thingtracker.no-ip.org
echo "Replicating things from http://thingtracker.no-ip.org"
curl --request POST http://localhost:5984/_replicate --header 'Content-Type: application/json' --data '{ "source": "http://thingtracker.no-ip.org/root/things", "target": "things", "create_target": true}'

# alter the configuration to allow insecure url rewrites
echo "Allowing insecure url rewrites"
curl --request PUT http://localhost:5984/_config/httpd/secure_rewrites --data '"false"'

# alter the configuration to allow proxy authentication
echo "Allowing proxy authentication"
echo \"`curl --request GET --silent http://localhost:5984/_config/httpd/authentication_handlers | tr --delete '"'`, {couch_httpd_auth, proxy_authentication_handler}\" | curl --request PUT --header 'Content-Type: application/json' --data @- http://localhost:5984/_config/httpd/authentication_handlers
curl --request GET --silent http://localhost:5984/_uuids | grep --regexp=\\[\".*\"\\] --only-matching | grep --regexp=\".*\" --only-matching | curl --request PUT --header 'Content-Type: application/json' --data @- http://localhost:5984/_config/couch_httpd_auth/secret
curl --request PUT http://localhost:5984/_config/couch_httpd_auth/proxy_use_secret --data '"true"'

# enable CORS
echo "Enabling CORS from Thingiverse"
curl --request PUT http://localhost:5984/_config/httpd/enable_cors --data '"true"'
curl --request PUT http://localhost:5984/_config/cors/methods --data '"GET,POST,PUT"'
curl --request PUT http://localhost:5984/_config/cors/origins --data '"http://www.thingiverse.com"'

# set up proxies
echo "Creating Keybase proxy"
curl --request PUT http://localhost:5984/_config/httpd_global_handlers/keybase --data '"{couch_httpd_proxy, handle_proxy_req, <<\"https://keybase.io\">>}"'
echo "Creating Deluge proxy"
curl --request PUT http://localhost:5984/_config/httpd_global_handlers/json --data '"{couch_httpd_proxy, handle_proxy_req, <<\"http://localhost:8112\">>}"'
echo "Creating user_manager proxy"
curl --request PUT http://localhost:5984/_config/httpd_global_handlers/user_manager --data '"{couch_httpd_proxy, handle_proxy_req, <<\"http://localhost:8000\">>}"'
echo "Creating lucene proxy"
curl --request PUT http://localhost:5984/_config/httpd_global_handlers/_fti --data '"{couch_httpd_proxy, handle_proxy_req, <<\"http://localhost:5985\">>}"'

# set up os daemons
echo "Creating user_manager daemon"
curl --request PUT http://localhost:5984/_config/user_manager/listen_port --data '"8000"'
curl --request PUT http://localhost:5984/_config/user_manager/couchdb --data '"http://localhost:5984"'
curl --request PUT http://localhost:5984/_config/user_manager/username --data '"admin"'
curl --request PUT http://localhost:5984/_config/user_manager/userrole --data '"_admin"'
curl --request PUT http://localhost:5984/_config/os_daemons/user_manager --data '"/usr/bin/node /js/user_manager.js"'
echo "Creating lucene daemon"
curl --request PUT http://localhost:5984/_config/os_daemons/couchdb_lucene --data '"/couchdb-lucene/bin/run"'

# stop the CouchDB service
echo "Stopping CouchDB"
/usr/local/bin/couchdb -d

# clean up so this only occurs once
rm -f /.firstrun
