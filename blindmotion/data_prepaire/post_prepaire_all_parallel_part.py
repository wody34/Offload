#!/usr/bin/python

# Takes data generated by prepaire.py for several days and generates
# one mat file for further model training 

import os

BASE_PATH='~/blindmotion'
WORK_PATH='~/blindmotion/training'
NUM_EL_GYR_ACC=20
NUM_EL_SPEED=5

datesTrain = [
    ('2014-09-17', '20140917'),
    ('2014-10-15', '20141015'),
#    ('2014-10-16', '20141016'),
#    ('2014-10-17', '20141017'),
#    ('2014-10-18', '20141018'),
#    ('2014-10-24', '20141024'),
#    ('2014-11-29', '20141129'),
#    ('2014-11-30', '20141130'),
#    ('2015-01-25', '20150125'),
#    ('2014-10-14', '20141014'),
]

datesCv = [
    ('2014-09-18', '20140918'),
#    ('2014-12-16', '20141216'),
#    ('2014-11-25', '20141125'),
]

datesTest = [
    ('2014-11-26', '20141126'),
#    ('2014-10-25', '20141025'),
#    ('2014-10-23', '20141023'),
]

# cleanup

os.system('rm {WORK_PATH}/outTrain_part.csv'.format(WORK_PATH=WORK_PATH))
os.system('rm {WORK_PATH}/outCv_part.csv'.format(WORK_PATH=WORK_PATH))

# train

for dat in datesTrain:
    os.system('cat {WORK_PATH}/out-{date}.csv >> {WORK_PATH}/outTrain_part.csv'.
        format(WORK_PATH=WORK_PATH, date=dat[0]))

for dat in datesCv:
    os.system('cat {WORK_PATH}/out-{date}.csv >> {WORK_PATH}/outCv_part.csv'.
        format(WORK_PATH=WORK_PATH, date=dat[0]))

os.system('octave -q {BASE_PATH}/detector-master/core/prepaire.m \
    {WORK_PATH}/outTrain_part.csv {WORK_PATH}/outTrain_part.mat'
    .format(BASE_PATH=BASE_PATH, WORK_PATH=WORK_PATH))

os.system('octave -q {BASE_PATH}/detector-master/core/prepaire.m \
    {WORK_PATH}/outCv_part.csv {WORK_PATH}/outCv_part.mat'
    .format(BASE_PATH=BASE_PATH, WORK_PATH=WORK_PATH))
