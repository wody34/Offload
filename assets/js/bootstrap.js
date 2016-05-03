'use strict';


requirejs.config({
  'baseUrl': 'js',
  'paths': {
    'async': '/lib/requirejs-plugins/async',
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
    'googlemaps': 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDNSBJPOcl5lsoHGGLNPRhIOKx28Lwk0Rc&signed_in=true',
    'angular': '/lib/angular.min',
    'uiBootstrap': '/lib/ui-bootstrap-tpls-1.3.2.min',
    'underscore': '/lib/underscore-min',
    'angular-gantt': '/lib/angular-gantt/angular-gantt',
    'angular-moment': '/lib/angular-moment',
    'moment': '/lib/moment',
    'angular-gantt-table': '/lib/angular-gantt/angular-gantt-table-plugin',
    'angular-gantt-resizeSensor': '/lib/angular-gantt/angular-gantt-resizeSensor-plugin',
    'angular-gantt-labels': '/lib/angular-gantt/angular-gantt-labels-plugin',
    'angular-gantt-bounds': '/lib/angular-gantt/angular-gantt-bounds-plugin',
    'angular-gantt-dependencies': '/lib/angular-gantt/angular-gantt-dependencies-plugin',
    'angular-gantt-drawtask': '/lib/angular-gantt/angular-gantt-drawtask-plugin',
    'angular-gantt-groups': '/lib/angular-gantt/angular-gantt-groups-plugin',
    'angular-gantt-movable': '/lib/angular-gantt/angular-gantt-movable-plugin',
    'angular-gantt-overlap': '/lib/angular-gantt/angular-gantt-overlap-plugin',
    'angular-gantt-plugins': '/lib/angular-gantt/angular-gantt-plugins',
    'angular-gantt-progress': '/lib/angular-gantt/angular-gantt-progress-plugin',
    'angular-gantt-sortable': '/lib/angular-gantt/angular-gantt-sortable-plugin',
    'angular-gantt-tooltips': '/lib/angular-gantt/angular-gantt-tooltips-plugin',
    'angular-gantt-tree': '/lib/angular-gantt/angular-gantt-tree-plugin',
    'ElementQueries':'/lib/ElementQueries',
    'ResizeSensor':'/lib/ResizeSensor'
  },
  shim:{
    'angular':{
      deps:['jquery'],
      exports:'angular'
    },
    'underscore': {
      exports: '_'
    },
    'uiBootstrap':{
      deps:['jquery', 'angular']
    },
    'angular-moment':{
      deps:['moment']
    },
    'angular-gantt':{
      deps:['angular', 'angular-moment']
    },
    'angular-gantt-table':{
      deps:['angular-gantt']
    },
    'angular-gantt-resizeSensor':{
      deps:['angular-gantt', 'ElementQueries', 'ResizeSensor']
    },
    'angular-gantt-labels':{
      deps:['angular-gantt']
    },
    'angular-gantt-bounds': {
      deps:['angular-gantt']
    },
    'angular-gantt-dependencies': {
      deps:['angular-gantt']
    },
    'angular-gantt-drawtask': {
      deps:['angular-gantt']
    },
    'angular-gantt-groups': {
      deps:['angular-gantt']
    },
    'angular-gantt-movable': {
      deps:['angular-gantt']
    },
    'angular-gantt-overlap': {
      deps:['angular-gantt']
    },
    'angular-gantt-plugins': {
      deps:['angular-gantt']
    },
    'angular-gantt-progress': {
      deps:['angular-gantt']
    },
    'angular-gantt-sortable': {
      deps:['angular-gantt']
    },
    'angular-gantt-tooltips': {
      deps:['angular-gantt']
    },
    'angular-gantt-tree': {
      deps:['angular-gantt']
    },
    'app':{
      deps:['angular', 'async!googlemaps', 'uiBootstrap', 'underscore', 'moment',
        'angular-gantt',
        'angular-gantt-table',
        'angular-gantt-resizeSensor',
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
        'angular-gantt-tree',
        'ElementQueries',
        'ResizeSensor']
    }
  }
});


requirejs( [
    'jquery', //미리 선언해둔 path, jQuery는 AMD를 지원하기 때문에 이렇게 로드해도 jQuery 또는 $로 호출할 수 있다.
    'angular', //미리 선언해둔 path
    'app' //app.js
  ],

  //디펜던시 로드뒤 콜백함수
  function ($, angular) {
    //이 함수는 위에 명시된 모든 디펜던시들이 다 로드된 뒤에 호출된다.
    //주의해야할 것은, 디펜던시 로드 완료 시점이 페이지가 완전히 로드되기 전 일 수도 있다는 사실이다.

    //페이지가 완전히 로드된 뒤에 실행
    $(document).ready(function () {

      //위의 디펜던시 중 myApp이 포함된 app.js가 로드된 이후에 아래가 수행된다.
      //임의로 앵귤러 부트스트래핑을 수행한다.

      angular.bootstrap(document, ['blindMotion']);

    });

  }
);
