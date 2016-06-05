var app = angular.module('MobileAngularUiExamples', [
    'ngRoute',
    'mobile-angular-ui',
    'mobile-angular-ui.gestures'
]);

app.run(function($transform) {
    window.$transform = $transform;
});

//
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false'
// in order to avoid unwanted routing.
//
app.config(function($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'home.html', reloadOnSearch: false });
    $routeProvider.when('/offer/:src/:offerid', { templateUrl: 'productdesc.html', reloadOnSearch: false });
    $routeProvider.when('/product/:src/:prodid', { templateUrl: 'productdesc.html', reloadOnSearch: false });
    $routeProvider.when('/store/:storeid', { templateUrl: 'store-offer-prod.html', reloadOnSearch: false });
    $routeProvider.when('/nearByStores', { templateUrl: 'near-by-stores.html', reloadOnSearch: false });
    $routeProvider.when('/findStore', { templateUrl: 'find-store.html', reloadOnSearch: false });
    $routeProvider.when('/nearByProducts', { templateUrl: 'near-by-products.html', reloadOnSearch: false });
    $routeProvider.when('/settings', { templateUrl: 'settings.html', reloadOnSearch: false });
});

//
// `$touch example`
//

app.directive('toucharea', ['$touch', function($touch) {
    // Runs during compile
    return {
        restrict: 'C',
        link: function($scope, elem) {
            $scope.touch = null;
            $touch.bind(elem, {
                start: function(touch) {
                    $scope.touch = touch;
                    $scope.$apply();
                },

                cancel: function(touch) {
                    $scope.touch = touch;
                    $scope.$apply();
                },

                move: function(touch) {
                    $scope.touch = touch;
                    $scope.$apply();
                },

                end: function(touch) {
                    $scope.touch = touch;
                    $scope.$apply();
                }
            });
        }
    };
}]);

//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function($drag, $parse, $timeout) {
    return {
        restrict: 'A',
        compile: function(elem, attrs) {
            var dismissFn = $parse(attrs.dragToDismiss);
            return function(scope, elem) {
                var dismiss = false;

                $drag.bind(elem, {
                    transform: $drag.TRANSLATE_RIGHT,
                    move: function(drag) {
                        if (drag.distanceX >= drag.rect.width / 4) {
                            dismiss = true;
                            elem.addClass('dismiss');
                        } else {
                            dismiss = false;
                            elem.removeClass('dismiss');
                        }
                    },
                    cancel: function() {
                        elem.removeClass('dismiss');
                    },
                    end: function(drag) {
                        if (dismiss) {
                            elem.addClass('dismitted');
                            $timeout(function() {
                                scope.$apply(function() {
                                    dismissFn(scope);
                                });
                            }, 300);
                        } else {
                            drag.reset();
                        }
                    }
                });
            };
        }
    };
});

//
// Another `$drag` usage example: this is how you could create
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function() {
    return {
        restrict: 'C',
        scope: {},
        controller: function() {
            this.itemCount = 0;
            this.activeItem = null;

            this.addItem = function() {
                var newId = this.itemCount++;
                this.activeItem = this.itemCount === 1 ? newId : this.activeItem;
                return newId;
            };

            this.next = function() {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem === this.itemCount - 1 ? 0 : this.activeItem + 1;
            };

            this.prev = function() {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
            };
        }
    };
});

app.directive('carouselItem', function($drag) {
    return {
        restrict: 'C',
        require: '^carousel',
        scope: {},
        transclude: true,
        template: '<div class="item"><div ng-transclude></div></div>',
        link: function(scope, elem, attrs, carousel) {
            scope.carousel = carousel;
            var id = carousel.addItem();

            var zIndex = function() {
                var res = 0;
                if (id === carousel.activeItem) {
                    res = 2000;
                } else if (carousel.activeItem < id) {
                    res = 2000 - (id - carousel.activeItem);
                } else {
                    res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
                }
                return res;
            };

            scope.$watch(function() {
                return carousel.activeItem;
            }, function() {
                elem[0].style.zIndex = zIndex();
            });

            $drag.bind(elem, {
                //
                // This is an example of custom transform function
                //
                transform: function(element, transform, touch) {
                    //
                    // use translate both as basis for the new transform:
                    //
                    var t = $drag.TRANSLATE_BOTH(element, transform, touch);

                    //
                    // Add rotation:
                    //
                    var Dx = touch.distanceX,
                        t0 = touch.startTransform,
                        sign = Dx < 0 ? -1 : 1,
                        angle = sign * Math.min((Math.abs(Dx) / 700) * 30, 30);

                    t.rotateZ = angle + (Math.round(t0.rotateZ));

                    return t;
                },
                move: function(drag) {
                    if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
                        elem.addClass('dismiss');
                    } else {
                        elem.removeClass('dismiss');
                    }
                },
                cancel: function() {
                    elem.removeClass('dismiss');
                },
                end: function(drag) {
                    elem.removeClass('dismiss');
                    if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
                        scope.$apply(function() {
                            carousel.next();
                        });
                    }
                    drag.reset();
                }
            });
        }
    };
});

app.directive('dragMe', ['$drag', function($drag) {
    return {
        controller: function($scope, $element) {
            $drag.bind($element, {
                //
                // Here you can see how to limit movement
                // to an element
                //
                transform: $drag.TRANSLATE_INSIDE($element.parent()),
                end: function(drag) {
                    // go back to initial position
                    drag.reset();
                }
            }, { // release touch when movement is outside bounduaries
                sensitiveArea: $element.parent()
            });
        }
    };
}]);

//
// For this trivial demo we have just a unique MainController
// for everything
//
app.controller('MainController', function($rootScope, $scope, $location,
    $routeParams, $http, $timeout) {
    $scope.prodPageSrc = null;
    $scope.prodPage_showStrBtn = true;
    $scope.isIntrested = false;
    $scope.showBackBtn = false;
    $scope.masterUrl = "http://shopme-epamershackers.rhcloud.com/";

    $scope.swiped = function(direction) {
        alert('Swiped ' + direction);
    };
    $scope.currPage = "Home";
    var beacon;

    $scope.setTimer = function() {
        beacon = setInterval(function() {
              $timeout(function(){
                $scope.beaconArr = window.dApp.beaconArr;
                $scope.beaconArrLength = window.dApp.beaconArr.length;
                $scope.$apply();
                //alert("app.js " + window.dApp.beaconArr.length);
                if ($scope.beaconArrLength > 0) {
                  if($scope.currPage == "Home"){
                    $scope.getOfferList();
                  }else if($scope.currPage == "product"){
                    $scope.getNearbyProductList();
                  }else if($scope.currPage == "store"){
                    $scope.getNearbyStoreList();
                  }

                }
              }, 1);
        }, 2000);
    };

    $scope.setTimer();

    // User agent displayed in home page
    $scope.userAgent = navigator.userAgent;

    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function() {
        $rootScope.loading = true;
    });

    $rootScope.$on('$routeChangeSuccess', function() {
        $rootScope.loading = false;
    });

    // Fake text i used here and there.
    $scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

    //
    // 'Scroll' screen
    //
    var scrollItems = [];

    for (var i = 1; i <= 100; i++) {
        scrollItems.push('Item ' + i);
    }

    $scope.scrollItems = scrollItems;

    $scope.bottomReached = function() {
        /* global alert: false; */
        alert('Congrats you scrolled to the end of the list!');
    };


    $scope.login = function() {
        alert('You submitted the login form');
    };

    //
    // 'Drag' screen
    //
    $scope.notices = [];

    for (var j = 0; j < 10; j++) {
        $scope.notices.push({ icon: 'envelope', message: 'Notice ' + (j + 1) });
    }

    $scope.deleteNotice = function(notice) {
        var index = $scope.notices.indexOf(notice);
        if (index > -1) {
            $scope.notices.splice(index, 1);
        }
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.onProdListItemClickfromHome = function(evt) {
        $location.path("/product/home/354645675");
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.onOfferListItemClickfromHome = function(evt) {
        $location.path("/offer/home/23432453");
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.onStoreListItemClickfromHome = function(evt) {
        $location.path("/store/12345");
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.onProductDescriptionPageInit = function() {
            console.log("Product Desc Page Initiated :: " + $routeParams.prodid);
            $scope.prodPageSrc = $routeParams.src;
            if ($scope.prodPageSrc == "home") {
                $scope.prodPage_showStrBtn = true;
            } else if ($scope.prodPageSrc == "store") {
                $scope.prodPage_showStrBtn = false;
            }
        }
        //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.goToStorePage = function() {
        $location.path("/store/6789");
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.iAmIntrested = function() {
        $scope.isIntrested = true;
        /*
        $http.post("http://example.appspot.com/rest/app", {"foo":"bar"})
        .success(function(data, status, headers, config) {
            $scope.data = data;
        }).error(function(data, status, headers, config) {
            $scope.status = status;
        });
        //*/

    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.getOfferList = function() {
        $scope.beaconArr = [{"uid":"B5B182C7-EAB1-4988-AA99-B5C1517008D9","ma":1,"mi":8810,"rs":"-44"},{"uid":"B5B182C7-EAB1-4988-AA99-B5C1517008D9","ma":1,"mi":500,"rs":"-44"}];
        $scope.currPage = "Home";
        clearInterval(beacon);
        var reqObj = new Object();
        reqObj.reqType = "OFFER";
        reqObj.beacons = $scope.beaconArr;
        reqObj.storeid = null;
        $http.post($scope.masterUrl + "view/", reqObj)
            .success(function(data, status, headers, config) {
                $scope.offerListData = data;
                $scope.setTimer();
            }).error(function(data, status, headers, config) {
                $scope.setTimer();
                $scope.status = status;
            });
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.getNearbyProductList = function(){
      $scope.currPage = "Product";
      clearInterval(beacon);
     $scope.beaconArr = [{"uid":"2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6","ma":1,"mi":600,"rs":"-44"},{"uid":"2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6","ma":1,"mi":700,"rs":"-44"}];
      var reqObj = new Object();
      reqObj.reqType = "PRODUCT";
      reqObj.beacons = $scope.beaconArr;
      reqObj.storeid = null;
      $http.post($scope.masterUrl + "view/", reqObj)
          .success(function(data, status, headers, config) {
              $scope.prodListData = data;
              $scope.setTimer();
              //console.log($scope.data);
          }).error(function(data, status, headers, config) {
              $scope.setTimer();
              $scope.status = status;
          });
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.getNearbyStoreList = function(){
      $scope.currPage = "Store";
     $scope.beaconArr = [{"uid":"B5B182C7-EAB1-4988-AA99-B5C1517008D9","ma":1,"mi":108,"rs":"-44"},{"uid":"B5B182C7-EAB1-4988-AA99-B5C1517008D9","ma":1,"mi":150,"rs":"-44"}];
      clearInterval(beacon);
      var reqObj = new Object();
      reqObj.reqType = "STORE";
      reqObj.beacons = $scope.beaconArr;
      reqObj.storeid = null;
      $http.post($scope.masterUrl + "view/", reqObj)
          .success(function(data, status, headers, config) {
              $scope.storeListData = data;
              $scope.setTimer();
          }).error(function(data, status, headers, config) {
              $scope.setTimer();
              $scope.status = status;
          });
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

    $scope.offerListData =
[
  {
    "offerId": 1,
    "storeId": 1,
    "prodId": null,
    "reqType": "OFFER",
    "cat": null,
    "per": "9%",
    "shopName": null,
    "sDesc": null,
    "lDesc": "iPhone 6S ",
    "imageName": "iphone6s.jpg"
  },
  {
    "offerId": 2,
    "storeId": 1,
    "prodId": null,
    "reqType": "OFFER",
    "cat": null,
    "per": "15%",
    "shopName": null,
    "sDesc": null,
    "lDesc": "Samsung edge 7",
    "imageName": "samsungedge7.jpg"
  },
  {
    "offerId": 3,
    "storeId": 2,
    "prodId": null,
    "reqType": "OFFER",
    "cat": null,
    "per": "4%",
    "shopName": null,
    "sDesc": null,
    "lDesc": "Kowloon milk",
    "imageName": "kowloonmilk.jpg"
  },
  {
    "offerId": 4,
    "storeId": 2,
    "prodId": null,
    "reqType": "OFFER",
    "cat": null,
    "per": "7%",
    "shopName": null,
    "sDesc": null,
    "lDesc": "President butter",
    "imageName": "presidentbutter.jpg"
  }
];
$scope.prodListData = [
  {
    "offerId": null,
    "storeId": 1,
    "prodId": 1,
    "reqType": "PRODUCT",
    "cat": "Electronic",
    "per": null,
    "shopName": "Sunning",
    "sDesc": "iPhone 6S - Silver",
    "lDesc": "Internal memory:16 GB|Main Camera:8 MP|Front Camera:3 MP",
    "imageName": "iphone6s.jpg"
  },
  {
    "offerId": null,
    "storeId": 1,
    "prodId": 1,
    "reqType": "PRODUCT",
    "cat": "Electronic",
    "per": null,
    "shopName": "Sunning",
    "sDesc": "Samsung edge 7 - Black",
    "lDesc": "Internal memory:32 GB|Main Camera:8 MP|Front Camera:5 MP",
    "imageName": "samsungedge7.jpg"
  }
];
$scope.storeListData = [{"offerId":null,"storeId":1,"prodId":null,"reqType":"STORE","cat":null,"per":null,"shopName":"Sunning","sDesc":"Electronic Shop","lDesc":"Biggest Electronics Chain in China","imageName":"sunnings.jpg"},{"offerId":null,"storeId":2,"prodId":null,"reqType":"STORE","cat":null,"per":null,"shopName":"Wallmart","sDesc":"Wallmart store","lDesc":"Biggest Retail in CHina","imageName":"apple.jpg"}];
});
