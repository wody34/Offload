'use strict';

//requireJS 모듈 선언 - [myApp 앵귤러 모듈]
define([
    'angular', //앵귤러 모듈을 사용하기 위해 임포트
    'uiBootstrap',
  ],

  //디펜던시 로드뒤 콜백함수
  function (angular) {
    //모듈 선언
    var $app = angular.module('blindMotion', ['ui.bootstrap']);

    //공통 컨트롤러 설정 - 모든 컨트롤러에서 공통적으로 사용하는 부분들 선언
    $app.controller('BlindMotionController', function($scope) {
      var marker;
      var map;

      var speed = 1;

      (function initMap() {
        var vid = document.getElementById("drive_video");
        // vid.playbackRate = speed;
        vid.src = "/video/2016-04-26_drive.mp4"
        $.get('/blindmotion/2016-04-26_SensorDatafile_smooth.csv').done(function (data) {
          $.get('/blindmotion/2016-04-26_events.json').done(function (eventData) {
            var json = CSV2JSON(data);
            sensorProcess(json);

            map = new google.maps.Map(document.getElementById('map'), {
              zoom: 17,
              center: trajectory[1]
            });

            eventProcess(eventData);

            var currtime = 0;
//            var timeLine = time[1];
//            var timeLineEnd = time[time.length];

            marker = new google.maps.Marker({
              position: trajectory[1],
              map: map,
              icon: new google.maps.MarkerImage('/images/car.png',
                new google.maps.Size(48, 48),
                new google.maps.Point(0, 0),
                new google.maps.Point(24, 24))
            });

            var count = 0;
            for (var i = 0; i < time.length; i++) {
              while (true) {
                if (time[i].second >= (currtime + time[0].second)) {
                  currtime += 1;
                }
                else
                  break;
              }

              moveMarkerWithTimeout(trajectory[i], currtime * 1000 / speed);
              // console.log(eventTime[count].original, time[0].original, currtime)

              if ((eventTime[count].second - time[0].second) <= currtime) {
                // console.log('entitle event')
                addEventWithTimeout(trajectory[i], eventType[count], currtime * 1000 / speed);

                count++;
              }
            }
          });
        });
      })();


      function moveMarkerWithTimeout(position, timeout) {
        window.setTimeout(function() {
          marker.setPosition(new google.maps.LatLng(position.lat, position.lng));
          map.panTo(new google.maps.LatLng(position.lat, position.lng));
        }, timeout);
      }

      function addEventWithTimeout(position, eventType, timeout) {
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

      var trajectory = [];
      var time = [];

      function sensorProcess(json) {
        var sensor = JSON.parse(json);
        var lan, lng;
        for (var index in sensor) {

          if (sensor[index].geo !== 'geo' || sensor[index].provider !== 'gps') {
            continue;
          }

          lan = sensor[index].lat;
          lng = sensor[index].lon;

          var tmp = {};

          tmp.lat = parseFloat(lan);
          tmp.lng = parseFloat(lng);

          trajectory.push(tmp);

          time.push(toSecond(sensor[index].time));
        }
      }

      var eventTime = [];
      var eventType = [];

      function eventProcess(eventData) {
        for (var index in eventData) {
          eventTime.push(toSecond(eventData[index].start));
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

          eventType.push(indicator);
        }
      }

      function toSecond(stringTime) {
        var hms = stringTime.split(":")
        return {original: stringTime, second: ((parseInt(hms[0])*60) + parseInt(hms[1])) * 60 + parseInt(hms[2])};
      }
    });

    return $app;
  }
);
