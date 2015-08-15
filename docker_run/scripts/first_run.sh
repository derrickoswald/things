#!/bin/bash

# start the CouchDB service
echo "Starting CouchDB"
/usr/local/bin/couchdb -b
while ! nc -vz localhost 5984; do sleep 1; done

# replicate things database from http://thingtracker.no-ip.org
echo "Replicating things from http://thingtracker.no-ip.org"
curl -X POST http://127.0.0.1:5984/_replicate -H 'Content-Type: application/json' -d '{ "source": "http://thingtracker.no-ip.org/root/things", "target": "things", "create_target": true}'

# alter the configuration to allow insecure url rewrites
echo "Allowing insecure url rewrites"
curl -X PUT http://127.0.0.1:5984/_config/httpd/secure_rewrites -d '"false"'

# stop the CouchDB service
echo "Stopping CouchDB"
/usr/local/bin/couchdb -d

# clean up so this only occurs once
rm -f /.firstrun
