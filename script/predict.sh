#!/usr/bin/env bash

#./detector-master/data_prepaire/generate_events.py -i ~/blindmotion/sensors/2014-09-18_SensorDatafile_smooth.csv -o ~/blindmotion/training/events/2014-09-18/data.csv -t ~/blindmotion/training/events/2014-09-18/time.csv

#octave -q ~/blindmotion/detector-master/core/prepaire_events.m ~/blindmotion/training/events/2014-09-18/data.csv ~/blindmotion/training/events/2014-09-18/data.mat

cd ./detector-master/core && octave -q predict_events.m ~/blindmotion/training/tmp/result.mat ~/blindmotion/training/events/2015-01-25/data.mat ~/blindmotion/training/events/2015-01-25/time.csv ~/blindmotion/training/events/2015-01-25/results/out_y.csv ~/blindmotion/training/events/2015-01-25/results/out_time.csv
#cd ../..
#python ./detector-master/scripts/post_process_events.py -d ./training/events/2014-09-18/results/out_y.csv -t ./training/events/2014-09-18/results/out_time.csv -o ./training/events/2014-09-18/results/events.json --epsilon 1 --min-samples 7
#
#python ./detector-master/scripts/compaire_events.py -a ./events/20140918/all.json -p ./training/events/2014-09-18/results/events.json