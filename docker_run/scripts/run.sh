#!/bin/bash

# initialize if this is the first run
if [[ -e /.firstrun ]]; then
    /scripts/first_run.sh
fi

# start deluge daemon
deluged --config=/usr/local/etc/deluge --logfile=/usr/local/var/log/deluge/deluged.log --loglevel=warning

# start deluge web
deluge-web --fork --config=/usr/local/etc/deluge --logfile=/usr/local/var/log/deluge/deluge-web.log --loglevel=warning

# start CouchDB
echo "Starting CouchDB..."
/usr/local/bin/couchdb
