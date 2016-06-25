'use strict';

//requireJS 모듈 선언 - [myApp 앵귤러 모듈]
define([
    'angular', //앵귤러 모듈을 사용하기 위해 임포트
    'moment',
    'amcharts',
    'uiBootstrap',
    'underscore'
  ],

  //디펜던시 로드뒤 콜백함수
  function (angular, moment, amcharts) {
    //모듈 선언
    var $app = angular.module('blindMotion', ['ui.bootstrap']);


    $app.controller('C2VSim', ['$scope', '$http', function($scope, $http){

      $scope.options = {
        vel: [{
          value: 'fast'
        }, {
          value: 'slow'
        }]
      };
      $scope.numberOfFrame = 200;
      $scope.sim_env = {
        cells: [[15, 1], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10]],
        realcells: [[15, 1], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50]],
        handoverDistance: 1000,
        posX: 20,
        vel: 'fast',
        apps: {
          voiceCommand: {
            cycle: 2550000000,
            tr: 166242,
            rc: 28,
            parallel: 1
          },
          voiceQuery: {
            cycle: 2550000000+25901448907,
            tr: 166242,
            rc: 7,
            parallel: 1
          },
          vision240p: {
            cycle: 232508182760/23/360,
            tr: 3013874/360 * 200,
            rc: 41900 * 200,
            parallel: 4
          },
          visionFHD: {
            cycle: 333871745528/10/18 * 200,
            tr: 2424529193/166488 * 200,
            rc: 41900 * 200,
            parallel: 4
          }
        },
        resources: {
          vehicle: {
            freq:1200000000,
            core:[0.1, 0.1]
          },
          cloud: [
            // {Model: 'i5_4590',freq:3300000000, core:[0.1, 0.2, 0.3, 0.4]},
            {Model: 'i7_4790',freq:3600000000, core:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]},
            // {Model: 'i5_4590',freq:2270000000, core:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]},
          ]
        }
      };

      $scope.addCell = function(value) {
        if(value)
          $scope.sim_env.cells.push([1,1]);
        else
          $scope.sim_env.cells.pop();
      };

      $scope.addRealCell = function(value) {
        if(value)
          $scope.sim_env.realcells.push([1,1]);
        else
          $scope.sim_env.realcells.pop();
      };

      $scope.$watch('numberOfFrame', function() {
        $scope.sim_env.apps.vision240p.cycle = 232508182760/23/360 * $scope.numberOfFrame;
        $scope.sim_env.apps.vision240p.tr = 3013874/360 * $scope.numberOfFrame;
        $scope.sim_env.apps.vision240p.rc = 41900 * $scope.numberOfFrame;
        $scope.sim_env.apps.visionFHD.cycle = 333871745528/10/18 * $scope.numberOfFrame;
        $scope.sim_env.apps.visionFHD.tr = 2424529193/166488 * $scope.numberOfFrame;
        $scope.sim_env.apps.visionFHD.rc = 41900 * $scope.numberOfFrame;
      });

      $scope.$watch('sim_env', function() {
        $http.post('/Sim/t1', $scope.sim_env).success(function (data, status, headers, config) {
          console.log(JSON.stringify(data, null, 4));
          $scope.indicator = (data === "Error")?"ErrorErrorErrorErrorErrorError":"SuccessSuccessSuccessSuccessSuccess";
          $scope.result = JSON.stringify(data, null, 4);
          for(var name in data) {
            var app = data[name];
            $scope.generateGraph(name, data[name]);
          }
        });
      }, true);



      $scope.generateGraph = function(appName, appResult) {
        amcharts.makeChart(appName, {
          "type": "serial",
          "theme": "light",
          "legend": {
            "horizontalGap": 10,
            "maxColumns": 1,
            "position": "right",
            "useGraphSettings": true,
            "markerSize": 10
          },
          "dataProvider": [{
            "method": "Vehicle",
            "vehicle": appResult.vehicle.toFixed(3)
          }, {
            "method": "Adaptive Offloaing Decision",
            "tx": appResult.eTime.tr.toFixed(3),
            "proc": appResult.eTime.proc.toFixed(3),
            "rx": appResult.eTime.rc.toFixed(3)
          }, {
            "method": "MAUI Decision",
            "tx": appResult.prevEnv.tr.toFixed(3),
            "proc": appResult.prevEnv.proc.toFixed(3),
            "rx": appResult.prevEnv.rc.toFixed(3)
          }, {
            "method": "Offloading Results",
            "tx": appResult.realEnv.tr.toFixed(3),
            "proc": appResult.realEnv.proc.toFixed(3),
            "rx": appResult.realEnv.rc.toFixed(3)
          }],

          "valueAxes": [{
            "stackType": "regular",
            "axisAlpha": 0.3,
            "gridAlpha": 0
          }],
          "graphs": [{
            "balloonText": "<b>[[title]]</b><br><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "[[value]]",
            "lineAlpha": 0.3,
            "title": "Vehicle Processing Time",
            "type": "column",
            "color": "#000000",
            "valueField": "vehicle"
          }, {
            "balloonText": "<b>[[title]]</b><br><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "[[value]]",
            "lineAlpha": 0.3,
            "title": "Cloud Tx Time",
            "type": "column",
            "color": "#000000",
            "valueField": "tx"
          }, {
            "balloonText": "<b>[[title]]</b><br><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "[[value]]",
            "lineAlpha": 0.3,
            "title": "Cloud Processing Time",
            "type": "column",
            "color": "#000000",
            "valueField": "proc"
          }, {
            "balloonText": "<b>[[title]]</b><br><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
            "fillAlphas": 0.8,
            "labelText": "[[value]]",
            "lineAlpha": 0.3,
            "title": "Cloud Rx Time",
            "type": "column",
            "color": "#000000",
            "valueField": "rx"
          }],
          "categoryField": "method",
          "categoryAxis": {
            "gridPosition": "start",
            "axisAlpha": 0,
            "gridAlpha": 0,
            "position": "left"
          },
          "export": {
            "enabled": true
          }

        });
      };
    }]);


    return $app;
  }
);
