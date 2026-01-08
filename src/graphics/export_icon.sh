#!/bin/bash


for infile in app_icon_light app_icon_dark
do
    inkscape --export-type=png --export-filename="./${infile}_32.png" --export-dpi=6 "./${infile}.svg"
    inkscape --export-type=png --export-filename="./${infile}_48.png" --export-dpi=9 "./${infile}.svg"
    inkscape --export-type=png --export-filename="./${infile}_64.png" --export-dpi=12 "./${infile}.svg"
    inkscape --export-type=png --export-filename="./${infile}_96.png" --export-dpi=18 "./${infile}.svg"
    inkscape --export-type=png --export-filename="./${infile}_128.png" --export-dpi=24 "./${infile}.svg"
    inkscape --export-plain-svg --export-filename="./${infile}_web.svg" "./${infile}.svg"
done
