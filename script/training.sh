#!/usr/bin/env bash

#./normalizer-master/Normalizer -output ./sensors/2014-09-18_SensorDatafile_norm.csv ./sensors/2014-09-18_SensorDatafile.csv

coffee ./modifier-develop/modifier.coffee --input ./sensors/2014-09-18_SensorDatafile_norm.csv --output ./sensors/2014-09-18_SensorDatafile_smooth.csv --modifier ./dashboard-master/modifiers/smooth.coffee

#./detector-master/data_prepaire/prepaire_all_parallel.py

#./detector-master/data_prepaire/post_prepaire_all_parallel.py

#cd ./detector-master/core && octave -q main.m ~/blindmotion/training/outTrain.mat ~/blindmotion/training/tmp/result.mat