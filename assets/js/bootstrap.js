'use strict';


requirejs.config({
  'baseUrl': 'js',
  'paths': {
    'async': '/lib/requirejs-plugins/async',
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
    'googlemaps': 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDNSBJPOcl5lsoHGGLNPRhIOKx28Lwk0Rc&signed_in=true',
    'angular': '/lib/angular.min',
    'uiBootstrap': '/lib/ui-bootstrap-tpls-1.3.2.min'
  },
  shim:{
    'angular':{
      deps:['jquery'],
      exports:'angular'
    },
    'uiBootstrap':{
      deps:['jquery', 'angular']
    },
    'app':{
      deps:['angular', 'async!googlemaps', 'uiBootstrap']
    }
  }
});


requirejs( [
    'jquery', //미리 선언해둔 path, jQuery는 AMD를 지원하기 때문에 이렇게 로드해도 jQuery 또는 $로 호출할 수 있다.
    'angular', //미리 선언해둔 path
    'app', //app.js
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
