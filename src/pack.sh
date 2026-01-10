#!/bin/sh

mkdir ../dist

zip -9 -r ../dist/timetracker_extension.xpi ./extension/

# brave --pack-extension=extension --pack-extension-key=/path/to/key
brave --pack-extension=extension
mv extension.crx ../dist/timetracker_extension.crx
mv extension.pem ../dist/timetracker_extension.pem

