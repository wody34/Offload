'use strict';

//requireJS 모듈 선언 - [myApp 앵귤러 모듈]
define([
    'angular', //앵귤러 모듈을 사용하기 위해 임포트
    'moment',
    'uiBootstrap',
    'underscore',
    'angular-gantt',
    'angular-gantt-table',
    'angular-gantt-labels',
    'angular-gantt-labels',
    'angular-gantt-bounds',
    'angular-gantt-dependencies',
    'angular-gantt-drawtask',
    'angular-gantt-groups',
    'angular-gantt-movable',
    'angular-gantt-overlap',
    'angular-gantt-plugins',
    'angular-gantt-progress',
    'angular-gantt-sortable',
    'angular-gantt-tooltips',
    'angular-gantt-tree'
  ],

  //디펜던시 로드뒤 콜백함수
  function (angular, moment) {
    //모듈 선언
    var $app = angular.module('blindMotion', ['ui.bootstrap', 'gantt',
      'gantt.sortable',
      'gantt.movable',
      'gantt.drawtask',
      'gantt.tooltips',
      'gantt.bounds',
      'gantt.progress',
      'gantt.table',
      'gantt.groups',
      'gantt.dependencies',
      'gantt.overlap']);

    $app.controller('C2VSim', ['$scope', '$http', function($scope, $http){
      $scope.data = [];
      $scope.options_gantt = {
        maxHeight: 400,
        fromDate: new Date(),
        toDate: new Date(),
        tooltipForm: 'MMM DD, HH:mm:ss'
      };
      $scope.colors = ['#5cb85c', '#f0ad4e', '#337ab7', '#d9534f'];

      $scope.headersFormats = {
        day: 'MMMM D',
        minute:'HH:mm',
        second:'ss'
      };

      $http.get('/C2VModel/5727027bd8e215873370b3da').success(function (data, status, headers, config) {
        $scope.model = _.pick(data, 'name', 'simulationSpec', 'networkModel', 'interVehicleModel', 'intraVehicleModel', 'cloudModel', 'compOffloadingModel');
      });

      $scope.options = {
        networkModel: [{
          value: 'OMNET++'
        }],
        interVehicleModel: [{
          value: 'SUMO'
        }, {
          value: 'other'
        }],
        executionModel: [{
          value: 'iCanCloud'
        }],
        compOffloadingModel: [{
          value: 'ModifiedMAUI1'
        }],
        perfDist: [{
          value: 'Randomly'
        }]
      };

      $scope.startSimulation = function() {
        var input = {};
        for(var i = 0; i < $scope.model.interVehicleModel.vehicleNumber; ++i) {
          input['V'+i] = [];
        }
        var base = new Date();

        $scope.options_gantt.fromDate = base;
        $scope.options_gantt.toDate = addSecond(base, $scope.model.simulationSpec.simulationTime);

        $http.post('/C2VModel', $scope.model).success(function(data, status, header, config) {
          $http.get('/C2VSim/C2VSim_Start_Multi?model='+data.id+'&app=5722fb189bd57fcd022cc5fc').success(function(data, status, headers, config) {
            $scope.results = data;
            for(var i = 0; i < data.task.length; ++i) {
              var tasks = data.task[i];
              var SLA = 500;
              for(var j = 0; j < tasks.length; ++j) {
                var task = tasks[j]
                if(task.state !== 'end')
                  continue;
                var transtime = task.rxTime - task.txTime;
                var transperc = 100;
                var proctime = task.procEndTime - task.procStartTime;
                var procperc = 100;
                if(SLA < 0) {
                  transperc = 0;
                }
                else if(SLA > transtime) {
                  transperc = 100;
                  SLA -= transtime;
                }
                else {
                  transperc = SLA/transtime*100;
                  SLA -= transtime;
                }

                if(SLA < 0) {
                  procperc = 0;
                }
                else if(SLA > proctime) {
                  procperc = 100;
                  SLA -= proctime;
                }
                else {
                  procperc = SLA/proctime*100;
                  SLA -= proctime;
                }

                if(task.execLoc) {
                  if(task.txTime !== task.rxTime)
                    input['V'+task.vehicleID].push({name: 'tx', from: addSecond(base, task.txTime) , to: addSecond(base, task.rxTime), color: $scope.colors[0], progress: {percent: transperc, sub: '#FF0000'}});
                  input['V'+task.vehicleID].push({name: 'VM'+task.VMID, from: addSecond(base, task.procStartTime) , to: addSecond(base, task.procEndTime), color: $scope.colors[1], progress: {percent: procperc, sub: '#FF0000'}})
                }
                else {
                  if(task.txTime !== task.rxTime)
                    input['V'+task.vehicleID].push({name: 'rx', from: addSecond(base, task.txTime) , to: addSecond(base, task.rxTime), color: $scope.colors[2], progress: {percent: transperc, sub: '#FF0000'}});
                  input['V'+task.vehicleID].push({name: 'Local', from: addSecond(base, task.procStartTime) , to: addSecond(base, task.procEndTime), color: $scope.colors[3], progress: {percent: procperc, sub: '#FF0000'}})
                }
              }
            }
            console.log($scope.data);
            $scope.addTasks(input);
          });
        });
      };

      function addSecond(base, sec) {
        return moment(base).add(parseInt(sec), 's').toDate();
      }

      function rgb(r, g, b) {
        return '#' + rand_r.toString(16) + rand_g.toString(16) + rand_b.toString(16);
      }


      $scope.removeIndex = function($index) {
        delete $scope.model.cloudModel[$index];
        $scope.model.cloudModel = _.compact($scope.model.cloudModel);
      };

      $scope.data_dic = {
      };

      $scope.clear = function(){
        $scope.data = [];
        $scope.data_dic = {};
      };

      $scope.addTasks = function(_tasks){
        for(var key in _tasks){
          if($scope.data_dic[key] == undefined){
            var tmp = {};
            tmp.name = key;
            tmp.tasks = [];
            while(_tasks[key].length != 0){
              tmp.tasks.push(_tasks[key].pop());
            }
            $scope.data.push(tmp);
            $scope.data_dic[key] = $scope.data.length - 1;
          }
          else{
            var index = $scope.data_dic[key];
            var target_row = $scope.data[index];
            while(_tasks[key].length != 0){
              target_row.tasks.push(_tasks[key].pop());
            }
          }
        };
      };
    }]);

    $app.controller('BlindMotionController', ['$scope', '$http', function($scope, $http) {

      (function initMap() {
        var speed = 1;
        var vid = document.getElementById("drive_video");
        // vid.playbackRate = speed;
        vid.src = "/video/2016-04-26_drive.mp4";

        $http.get('/blindmotion/2016-04-26_SensorDatafile_smooth.csv').success(function (data, status, headers, config) {
          $http.get('/blindmotion/2016-04-26_events.json').success(function (eventData, status, headers, config) {
            var json = CSV2JSON(data);
            var sensor = sensorProcess(json);
            eventProcess(eventData);

            var map = new google.maps.Map(document.getElementById('map'), {
              zoom: 17,
              center: sensor[0].trajectory
            });

            var marker = new google.maps.Marker({
              position: sensor[0].trajectory,
              map: map,
              icon: new google.maps.MarkerImage('/images/car.png',
                new google.maps.Size(48, 48),
                new google.maps.Point(0, 0),
                new google.maps.Point(24, 24))
            });

            var curtime = -1;
            var event_count = 0;
            for (var i = 0; i < sensor.length; i++) {
              while (sensor[i].time.second >= (++curtime + sensor[0].time.second));

              moveMarkerWithTimeout(map, marker, sensor[i].trajectory, curtime * 1000 / speed);
              // console.log(eventTime[count].original, time[0].original, currtime)

              if ((eventData[event_count].time.second - sensor[0].time.second) <= curtime) {
                // console.log('entitle event')
                addEventWithTimeout(map, sensor[i].trajectory, eventData[event_count].type, curtime * 1000 / speed);
                event_count++;
              }
            }
          })
        });
      })();


      function moveMarkerWithTimeout(map, marker, position, timeout) {
        window.setTimeout(function() {
          marker.setPosition(new google.maps.LatLng(position.lat, position.lng));
          map.panTo(new google.maps.LatLng(position.lat, position.lng));
        }, timeout);
      }

      function addEventWithTimeout(map, position, eventType, timeout) {
        window.setTimeout(function() {
          new google.maps.InfoWindow({
            content: 'Event: ' + eventType
          }).open(map, new google.maps.Marker({
            position: position,
            map: map
          }));
        }, timeout);
      }

      function CSVToArray(strData, strDelimiter) {
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");
        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp((
          // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        // Standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];
        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;
        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec(strData)) {
          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[1];
          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
          }
          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[2].replace(
              new RegExp("\"\"", "g"), "\"");
          } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[3];
          }
          // Now that we have our value string, let's add
          // it to the data array.
          arrData[arrData.length - 1].push(strMatchedValue);
        }
        // Return the parsed data.
        return (arrData);
      }

      function CSV2JSON(csv) {
        var array = CSVToArray(csv, ';');
        var objArray = [];
        for (var i = 1; i < array.length; i++) {
          objArray[i - 1] = {};

          for (var k = 0; k < array[0].length && k < array[i].length; k++) {
            var key = array[0][k];
            objArray[i - 1][key] = array[i][k]
          }
        }

        var json = JSON.stringify(objArray);
        return json.replace(/},/g, "},\r\n");
      }

      function sensorProcess(json) {
        var sensorData = JSON.parse(json);
        var sensors = [];
        for (var index in sensorData) {
          var sensor = sensorData[index];
          if (sensor.geo !== 'geo' || sensor.provider !== 'gps') {
            continue;
          }
          sensors.push({trajectory: {lat:parseFloat(sensor.lat), lng:parseFloat(sensor.lon)}, time: toSecond(sensor.time)});
        }
        return sensors;
      }

      function eventProcess(eventData) {
        for (var index in eventData) {
          var event = eventData[index];
          event.time = toSecond(event.start)

          var indicator = ""
          switch (eventData[index].type) {
            case 1:
              indicator = "C";
              break;
            case 2:
              indicator = "O";
              break;
            case 3:
              indicator = "T";
              break;
            case 4:
              indicator = "Q";
              break;
            case 5:
              if(eventData[index].direction === 0)
                indicator = "L";
              else
                indicator = "R";
              break;
            case 6:
              indicator = "U"
              break;
          }
          event.type = indicator;
        }
      }

      function toSecond(stringTime) {
        var hms = stringTime.split(":")
        return {original: stringTime, second: ((parseInt(hms[0]) * 60) + parseInt(hms[1])) * 60 + parseInt(hms[2])};
      }
    }]);

    return $app;
  }
);
