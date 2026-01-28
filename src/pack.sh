#!/bin/sh

mkdir ../dist

cp -r ./extension ../dist/
cd ../dist
mv ./extension/manifest_chrome.json ./
mv ./extension/manifest_firefox.json ./extension/manifest.json

(cd ./extension && zip -9 -r ../timetracker_extension.xpi *)

mv manifest_chrome.json ./extension/manifest.json

brave --pack-extension=extension --pack-extension-key=timetracker_extension.pem
# brave --pack-extension=extension
mv extension.crx timetracker_extension.crx
#cp extension.pem timetracker_extension.pem

rm -r extension


