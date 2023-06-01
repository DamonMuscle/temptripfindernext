(function()
{
	String.prototype.endsWith = function(suffix)
	{
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};

	ko.subscribable.fn.subscribeChanged = function(callback)
	{
		var oldValue;
		this.subscribe(function(_oldValue)
		{
			if (_oldValue.constructor == Array)
				oldValue = $.extend(true, [], _oldValue);
			else oldValue = _oldValue;
		}, null, 'beforeChange');
		if (this().constructor == Array)
		{
			this.subscribe(function(newValue)
			{
				callback.call(this, newValue, oldValue);
			}, null, 'arrayChange');
		}
		else
		{
			this.subscribe(function(newValue)
			{
				callback.call(this, newValue, oldValue);
			});
		}

	};

	var TF = createNamespace("TF");
	TF.extend = function()
	{
		var inlineOverride = function(o)
		{
			for (var m in o)
			{
				this[m] = o[m];
			}
		};

		return function(subFn, superFn, overrides)
		{
			if (typeof superFn == 'object')
			{
				overrides = superFn;
				superFn = subFn;
				subFn = function()
				{
					superFn.apply(this, arguments);
				};
			}
			var F = function() { },
				subFnPrototype,
				superFnPrototype = superFn.prototype;

			F.prototype = superFnPrototype;
			subFnPrototype = subFn.prototype = new F();
			subFnPrototype.constructor = subFn;
			subFn.superclass = superFnPrototype;
			if (superFnPrototype.constructor == Object.prototype.constructor)
			{
				superFnPrototype.constructor = superFn;
			}

			subFn.override = function(obj)
			{
				TF.override(subFn, obj);
			};

			subFnPrototype.override = inlineOverride;
			TF.override(subFn, overrides);
			return subFn;
		};
	}();

	TF.override = function(origclass, overrides)
	{
		if (overrides)
		{
			var p = origclass.prototype;
			for (var method in overrides)
			{
				p[method] = overrides[method];
			}
		}
	};

	TF.smartOverride = function(prototype, overrides)
	{
		for (var name in overrides)
		{
			var baseMethod = prototype[name];
			var method = overrides[name];
			prototype[name] = function()
			{
				arguments = Array.from(arguments);
				arguments.splice(0, 0, baseMethod);
				return method.apply(this, arguments);
			};
		}
	};

	TF.convertToObservable = function(item, ignoredProps)
	{
		for (var prop in item)
		{
			var ignoreThisProp = false;
			if (ignoredProps && ignoredProps.constructor == Array)
			{
				ignoredProps.some(function(p)
				{
					return ignoreThisProp = prop == p;
				});
			}
			if (!ignoreThisProp)
			{
				if (typeof (item[prop]) !== 'object')
				{
					item[prop] = ko.observable(item[prop]);
				}
			}
		}
	};

	TF.toDateString = function(date)
	{
		return date ? moment(date).format("YYYY-MM-DDT00:00:00.000") : null;
	};

	TF.getErrorMessage = function(res)
	{
		var defaultError = "An error occurs.";

		if (!res)
		{
			return defaultError;
		}

		if (typeof res === "string")
		{
			return res;
		}

		if (typeof res.TransfinderMessage === "string")
		{
			return res.TransfinderMessage;
		}

		if (typeof res.Message === "string")
		{
			return res.Message;
		}

		if (!res.Message)
		{
			return defaultError;
		}

		res.Message.Message = res.Message.Message || defaultError;
		if (typeof res.Message.Message === "string")
		{
			return res.Message.Message;
		}

		return defaultError;
	};

	TF.showErrorMessageBox = function(res)
	{
		return tf.promiseBootbox.alert(TF.getErrorMessage(res), "Error");
	};

	TF.updateProcessStatus = function(result)
	{
		tf.loadingIndicator.resetProgressbar();
		tf.loadingIndicator.changeProgressbar(result.Percentage, result.Message);
	};

	TF.DayOfWeek = {
		Monday: 1,
		Tuesday: 2,
		Wednesday: 3,
		Thursday: 4,
		Friday: 5,
		Saturday: 6,
		Sunday: 0,
	};

	TF.DayOfWeek.allValues = [1, 2, 3, 4, 5, 6, 0];

	TF.DayOfWeek.all = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

	TF.DayOfWeek.allSortByValue = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	TF.DayOfWeek.toString = function(value, shortTerm)
	{
		var str = TF.DayOfWeek.allSortByValue[value];
		return shortTerm ? str.substring(0, shortTerm) : str;
	};

	TF.createEnum = function(obj, displayNames, startValue)
	{
		obj.all = [];
		obj.allValues = [];
		startValue = startValue || 0;
		displayNames.forEach(function(item, index)
		{
			var name = item.replace(/ /g, "");
			obj[name] = index + startValue;
			obj.all.push({ displayName: item, name: name, id: index + startValue });
			obj.allValues.push(index + startValue);
		});

		obj.findById = function(id)
		{
			return obj.all.find(function(item)
			{
				return item.id === id;
			});
		};

		obj.find = function(key)
		{
			key = (key || "").toLowerCase();
			key = key.replace(/ /g, "");
			return obj.all.find(function(item)
			{
				return item.name.toLowerCase() === key;
			});
		};
	};

	var fileSaver = document.createElement("a");
	TF.saveStringAs = function(content, contentType, fileName)
	{
		contentType = contentType || "text/plain";
		fileName = fileName || "download";
		var blob = new Blob([content], { type: contentType }), dataURI = URL.createObjectURL(blob), e = document.createEvent("MouseEvents");
		fileSaver.download = fileName;
		fileSaver.href = dataURI;
		e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		fileSaver.dispatchEvent(e);
	};

	/* Code Copy From Extjs */
	Function.prototype.createInterceptor = function(fcn, scope)
	{
		var method = this;

		return !(typeof fcn === "function") ?
			this :
			function()
			{
				var me = this,
					args = arguments;
				fcn.target = me;
				fcn.method = method;
				return (fcn.apply(scope || me || window, args) !== false) &&
					!(args[0] && args[0].sender && args[0].sender.operator === "custom") ?
					method.apply(me || window, args) :
					null;
			};
	};

	Function.prototype.createSequence = function(fcn, scope)
	{
		var method = this;
		return (typeof fcn != "function") ?
			this :
			function()
			{
				var retval = method.apply(this || window, arguments);
				fcn.apply(scope || this || window, arguments);
				return retval;
			};
	};

	Function.prototype.createCallback = function()
	{
		// make args available, in function below
		var args = arguments,
			method = this;
		return function()
		{
			return method.apply(window, args);
		};
	};

	Function.prototype.interceptBefore = function(object, methodName, fn, scope)
	{
		var method = object[methodName] || function() { };
		return (object[methodName] = function()
		{
			var ret = fn.apply(scope || this, arguments);
			method.apply(this, arguments);
			return ret;
		});
	};

	Function.prototype.interceptAfter = function(object, methodName, fn, scope)
	{
		var method = object[methodName] || function() { };
		return (object[methodName] = function()
		{
			method.apply(this, arguments);
			return fn.apply(scope || this, arguments);
		});
	};
})();
