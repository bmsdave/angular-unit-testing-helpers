window.TestServ = function(name) {
  var _this = this;

  if (!!name) {
    inject([name, function(service) {
      _this = service;
    }]);
    return _this;
  }
};

window.TestServ.prototype = {
  addPromise: function(name) {
    var _this = this;
    _this[name] = function() {};
    spyOn(_this, name).and.returnValue({
      then: function(success, fail) {
        _this[name].success = success;
        _this[name].fail = fail;
      }
    });
  },

  addMethod: function(name, returnedValue) {
    this[name] = function() {};

    spyOn(this, name).and.returnValue(
      typeof returnedValue === "function" ? returnedValue() : returnedValue);
  }
}



window.TestElement = function(name) {
  var _this = this;
  inject(function($rootScope, $compile, $timeout, $controller, $templateCache) {
    _this._$scope = $rootScope.$new();
    _this.$originalScope = $rootScope.$new();
    _this.$compile = $compile;
    _this.$timeout = $timeout;
    _this.$controller = $controller;
    _this.$templateCache = $templateCache;
  });
  _this.name = name;
};

window.TestElement.prototype = {
  createDirective: function(html, scope) {
    var elem = angular.element(html);
    this._$scope = angular.extend(this.$originalScope, scope);
    this._el = this.$compile(elem)(this._$scope);
    this._$scope.$digest();

    try {
      this.$timeout.verifyNoPendingTasks();
    } catch (e) {
      this.$timeout.flush();
    }
    return this._el;
  },

  createCtrl: function(name, services) {
    services.$scope = this._$scope;
    this._ctrl = this.$controller(name, services);
    return this._ctrl;
  },

  addTemplate: function(path, ctrlAs) {
    var template;
    template = this.$templateCache.get(path);
    this._el = angular.element(template);

    if (!!ctrlAs) {
      this._$scope[ctrlAs] = this._ctrl;
    }

    this.$compile(this._el)(this._$scope);
    this._$scope.$digest();

    try {
      this.$timeout.verifyNoPendingTasks();
    } catch (e) {
      this.$timeout.flush();
    }

    return this._el;
  },

  get scope() {
    return this._$scope;
  },

  get ctrl() {
    return this._ctrl ? this._ctrl : angular.element(this._el).controller(this.name);
  },

  get dom() {
    return angular.element(this._el);
  },

  destroy: function() {
    this._$scope.$destroy();
    this._el = null;
  },

  clickOn: function(selector) {
    if (this.dom.find(selector)[0]) {
      this.dom.find(selector).click();
    } else {
      $(selector).click();
    }
    this._$scope.$digest();
    return this._getFlushedThenable();
  },

  inputOn: function(selector, value) {
    if (this.dom.find(selector)[0]) {
      this.dom.find(selector).val(value || '').trigger('input').trigger('keydown');
    } else {
      $(selector).val(value || '').trigger('input').trigger('keydown');
    }
    this._$scope.$digest();
    return this._getFlushedThenable();
  },

  _getFlushedThenable: function() {
    try {
      this.$timeout.verifyNoPendingTasks();
    } catch (e) {
      this.$timeout.flush();
    }
    return {
      then: function(fn) {
        fn();
      }
    };
  },
}