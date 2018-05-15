if (typeof kendo != 'undefined')
{
	kendo.ns = "kendo-";
}
$(function()
{
	var tf = createNamespace("tf.debug");
	tf.startup = new TF.Startup();
	tf.startup.start();
});

createNamespace("TF").productName = "tripfinder";

var namespace = createNamespace("pb");
pb.DATA_CHANGE = "datachange";
pb.ADD = "add";
pb.EDIT = "edit";
pb.DELETE = "delete";

function topicCombine()
{
	var args = Array.prototype.slice.call(arguments);
	if (Enumerable.From(args).Where(function(c)
	{
		return c == null || c == undefined
	}).ToArray().length != 0)
	{
		throw "some arguments are null or undefined";
	}
	var topic = Array.prototype.slice.call(arguments).join(".");
	if (topic != "")
	{
		return topic;
	}
	return null;
}

function pathCombine()
{
	var output = arguments[0];
	for (var i = 1, len = arguments.length; i < len; i++)
	{
		if (output.substr(output.length - 1) != "/")
		{
			output += "/" + arguments[i];
		} else
		{
			output += arguments[i];
		}
	}
	output = output.replace(/[/]+/g, "/").replace("http:/", "http://").replace("https:/", "https://");
	return output;
}

function toCamelCase(input)
{
	if (input.length < 1)
	{
		return input;
	}
	return input[0].toUpperCase() + input.toLowerCase().substring(1, input.length);
}

function isFunction(x)
{
	return Object.prototype.toString.call(x) == '[object Function]';
}

function isMobileDevice()
{
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isPhoneDevice()
{
	return isMobileDevice() && window.screen.width < 768;
}

function isSafari()
{
	var chrome = navigator.userAgent.indexOf('CriOS') > -1 || navigator.userAgent.indexOf('Chrome') > -1;
	var safari = navigator.userAgent.indexOf("Safari") > -1;
	if ((chrome) && (safari)) safari = false;
	return safari;
}

function isSmallScreen()
{
	return window.innerHeight < 621 || window.innerWidth < 621;
}

function isPortrait()
{
	return isMobileDevice() && window.innerHeight > window.innerWidth;
}

function isLandscape()
{
	return isMobileDevice() && window.innerWidth > window.innerHeight;
}

createNamespace("TF").isMobileDevice = isMobileDevice();
createNamespace("TF").isSafari = isSafari();
createNamespace("TF").isPhoneDevice = isPhoneDevice();
createNamespace("TF").isPortrait = isPortrait();
createNamespace("TF").isLandscape = isLandscape();

function getQueryString(name)
{
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
		hash = window.location.hash.split("?"),
		search = hash.length > 1 ? hash[1] : "";
	var r = search.match(reg);
	return r != null ? r[2] : null;
}

Array.remove = function(array, item)
{
	while ((index = array.indexOf(item)) > -1)
		array.splice(index, 1);
};

Array.extend = function(arr1, arr2)
{
	if (arguments.length <= 2)
	{
		Array.prototype.push.apply(arr1, arr2);
	} else
	{
		for (var i = 1; i < arguments.length; i++)
		{
			Array.prototype.push.apply(arr1, arguments[i]);
		}
	}
	return arr1;
};

Array.contain = function(arr, item)
{
	return arr.indexOf(item) != -1;
};

Array.equals = function(arr1, arr2)
{
	arr1 = arr1.sort();
	arr2 = arr2.sort();
	// if the other array is a falsy value, return
	if (!arr2)
		return false;

	// compare lengths - can save a lot of time
	if (arr1.length != arr2.length)
		return false;

	for (var i = 0, l = arr1.length; i < l; i++)
	{
		// Check if we have nested arrays
		if (arr1[i] instanceof Array && arr2[i] instanceof Array)
		{
			// recurse into the nested arrays
			if (!arr1[i].equals(arr2[i]))
				return false;
		} else if (arr1[i] != arr2[i])
		{
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};
// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex)
{
	Object.defineProperty(Array.prototype, 'findIndex', {
		value: function(predicate)
		{
			// 1. Let O be ? ToObject(this value).
			if (this == null)
			{
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function')
			{
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len)
			{
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return k.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o))
				{
					return k;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return -1.
			return -1;
		}
	});
}

String.format = function(format)
{
	var args = Array.prototype.slice.call(arguments, 1);
	return format.replace(/{(\d+)}/g, function(match, number)
	{
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
};

String.convertToBoolean = function(value)
{
	if (value === 'True')
		return true;
	else if (value === 'False')
		return false;
	else
		return value;
};

function removeEmptyProperties(obj)
{
	for (var i in obj)
	{
		if (obj[i] === null || obj[i] === undefined)
		{
			delete obj[i];
		}
	}
}

function toISOStringWithoutTimeZone(m)
{
	return m.format('YYYY-MM-DDTHH:mm:ss.SSS');
}

function addStyle(styleId, content)
{
	var doc = document,
		css = doc.getElementById(styleId);
	if (!css)
	{
		css = doc.createElement("style");
		css.id = styleId;
		css.type = "text/css";
		doc.getElementsByTagName("head")[0].appendChild(css);
	}

	if (css.styleSheet)
	{
		// IE
		css.styleSheet.cssText = content;
	} else
	{
		// Other browsers
		css.innerHTML = content;
	}
	return css;
}

function compareTimeColumn(a, b)
{
	var timeA = moment(moment(a).utc().format("1900/01/01 HH:mm:ss"));
	var timeB = moment(moment(b).utc().format("1900/01/01 HH:mm:ss"));

	var ret = timeA.isAfter(timeB) ? 1 : -1;
	return ret;
}

function compareTimeColumn2(a, b)
{
	var timeA = moment(moment(a).format("1900/01/01 HH:mm:ss"));
	var timeB = moment(moment(b).format("1900/01/01 HH:mm:ss"));

	var ret = timeA.isAfter(timeB) ? 1 : -1;
	return ret;
}

createNamespace("tf").colorSource = ["#FF0000", "#3333FF", "#FF6700", "#FF00FF", "#00FFFF", "#73D952", "#7F7FD0", "#AA0000", "#0000A2", "#CC5200", "#E10087", "#00CCCC", "#006600", "#FFCC00", "#D47F7F", "#FFFF00", "#E5A87F", "#F07FC3", "#7FE5E5", "#7FB27F", "#FFE57F"];

function colorRgb(sColor, transparency)
{
	var sColorChange = [];
	for (var i = 1; i < 7; i += 2)
	{
		sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
	}
	return "RGBA(" + sColorChange[0] + "," + sColorChange[1] + "," + sColorChange[2] + "," + transparency + ")";
}

(function()
{
	//disable default right click menu
	document.oncontextmenu = function(event)
	{
		if (window.event)
		{
			event = window.event;
			event.returnValue = false;
			return false;
		} else event.preventDefault();
	};
	createNamespace("TF").Color = Color;

	function Color()
	{

	}

	Color.toHTMLColorFromLongColor = function(longColor)
	{
		return "#" + _toHex(longColor % 65536 % 256) + _toHex(longColor % 65536 / 256) + _toHex((longColor / 65536));
	};

	Color.toLongColorFromHTMLColor = function(htmlColor)
	{
		htmlColor = htmlColor.substr(1, 6);
		return parseInt(htmlColor.substr(0, 2), 16) + parseInt(htmlColor.substr(2, 2), 16) * 256 + parseInt(htmlColor.substr(4, 2), 16) * 65536;
	};

	function _toHex(number)
	{
		return _padding(Math.floor(number).toString(16));
	}

	function _padding(input)
	{
		if (input.length == 1)
		{
			input = "0" + input;
		}
		return input.toUpperCase();
	}
})();

(function()
{
	createNamespace("TF").menuHelper = menuHelper;

	function menuHelper() { }

	menuHelper.hiddenMenu = function()
	{
		tf.contextMenuManager.dispose();
		//tf.pageManager.obContextMenuVisible(false);
	};

	menuHelper.isCurrentMenuOpened = function(e)
	{
		var $btn = $(e.target);
		var isCurrentlyBtnHasOpened = $btn.hasClass('contextmenu-open');
		return isCurrentlyBtnHasOpened;
	};

	menuHelper.isOtherMenuOpened = function(e)
	{
		if (TF.menuHelper.isCurrentMenuOpened(e))
			return false;

		return $('.contextmenu-open').hasClass('mobile');
	};

	menuHelper.needHiddenOpenedMenu = function(e)
	{
		return (
			TF.isPhoneDevice &&
			(
				TF.menuHelper.isOtherMenuOpened(e) ||
				TF.menuHelper.isCurrentMenuOpened(e)
			)
		);
	};

	menuHelper.needOpenCurrentMenu = function(e)
	{
		return !TF.isPhoneDevice || !TF.menuHelper.isCurrentMenuOpened(e);
	};
})();

/* Code Copy From Extjs */
Function.prototype.createInterceptor = function(fcn, scope)
{
	var method = this;


	return !(typeof fcn === 'function') ?
		this :
		function()
		{
			var me = this,
				args = arguments;
			fcn.target = me;
			fcn.method = method;
			return (fcn.apply(scope || me || window, args) !== false) ?
				method.apply(me || window, args) :
				null;
		};
};

Function.prototype.createSequence = function(fcn, scope)
{
	var method = this;
	return (typeof fcn != 'function') ? this : function()
	{
		var retval = method.apply(this || window, arguments);
		fcn.apply(scope || this || window, arguments);
		return retval;
	};
};


Function.prototype.createCallback = function( /*args...*/)
{    // make args available, in function below

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

tf.isTripfinder = true;