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
    $routeProvider.when('/productdesc/:src/:prodid', { templateUrl: 'productdesc.html', reloadOnSearch: false });
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
    $routeParams, $http) {
    $scope.prodPageSrc = null;
    $scope.prodPage_showStrBtn = true;
    $scope.isIntrested = false;
    $scope.showBackBtn = false;
    $scope.masterUrl = "http://shopme-epamershackers.rhcloud.com/";

    $scope.swiped = function(direction) {
        alert('Swiped ' + direction);
    };

    var beacon;

    $scope.setTimer = function() {
        beacon = setInterval(function() {
            window.setTimeout(function(){
              $scope.beaconArr = window.dApp.beaconArr;
              $scope.beaconArrLength = window.dApp.beaconArr.length;
              $scope.$apply();
              //alert("app.js " + window.dApp.beaconArr.length);
              if (beaconArrLength > 0) {
                $scope.getProductOfferList();
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
    $scope.onprodListItemClickfromHome = function(evt) {
        $location.path("/productdesc/home/12345");
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.onprodListItemClickfromStore = function(evt) {
        $location.path("/productdesc/store/12345");
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
    $scope.getProductOfferList = function() {
        alert("call ajax"); 
        clearInterval(beacon);
        var reqObj = new Object();
        reqObj.reqType = "PRODUCT";
        reqObj.beacons = $scope.beaconArr;
        reqObj.storeid = null;
        $http.post($scope.masterUrl + "view/", reqObj)
            .success(function(data, status, headers, config) {
                $scope.data = data;
                $scope.setTimer();
                alert("success");
                //console.log($scope.data);
            }).error(function(data, status, headers, config) {
                $scope.setTimer();
                $scope.status = status;
                //alert("error");
            });
    };
    //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
    $scope.productOfferListData = [];
});
