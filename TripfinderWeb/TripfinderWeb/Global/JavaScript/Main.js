if (typeof kendo != 'undefined')
{
	kendo.ns = "kendo-";
}
$(function()
{
	var redirectingPromise = window.determineRedirect2VanityUrlPromise || Promise.resolve(false);
	redirectingPromise.then(function(redirecting)
	{
		if (!redirecting)
		{
			const tf = createNamespace("tf");
			tf.startup = new TF.Startup();
			tf.startup.start();
		}
	});
});

createNamespace("TF").productName = "Tripfinder";

createNamespace("TF").vendor = "Transfinder";

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

/**
 * Fuzzy compare, so two empty values could match.
 *
 * @param {any} val1
 * @param {any} val2
 * @return {Boolean} 
 */
function fuzzyCompare(val1, val2)
{
	return (IsEmptyString(val1) && IsEmptyString(val2)) || val1 === val2;
}

function isNullObj(obj)
{
	return obj === null || obj === undefined;
}

function IsEmptyString(str)
{
	return (str === null ||
		str === undefined ||
		str === "");
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

function sortArray(array, sortField, isNum)
{
	return array.sort(function(a, b)
	{
		if (isNum)
		{
			if (a[sortField] === b[sortField])
			{
				return 0;
			}
			return a[sortField] > b[sortField] ? 1 : -1;
		}
		else
		{
			if (a[sortField].toUpperCase() === b[sortField].toUpperCase())
			{
				return 0;
			}
			return a[sortField].toUpperCase() > b[sortField].toUpperCase() ? 1 : -1;
		}
	});
}

function getParameterByName(name, url)
{
	if (!url)
	{
		url = window.location.href;
	}

	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);

	if (!results || !results[2])
	{
		return '';
	}
	return decodeURIComponent(results[2].replace(/\+/g, " "));
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

function isIOS()
{
	return navigator.userAgent.match(/(iPod|iPhone|iPad)/) ? true : false;
}

function getIOSVersion()
{
	const ua = navigator.userAgent;
	if (/(iPhone|iPod|iPad)/i.test(ua))
	{
		return ua.match(/OS [\d_]+/i)[0].substr(3).split('_').map(n => parseInt(n));
	}
	return [0];
}

function isSafari()
{
	var chrome = navigator.userAgent.indexOf('CriOS') > -1 || navigator.userAgent.indexOf('Chrome') > -1;
	var safari = navigator.userAgent.indexOf("Safari") > -1;
	if ((chrome) && (safari))
	{
		safari = false;
	}
	return safari;
}

function isMacintosh()
{
	return navigator.platform.indexOf('Mac') > -1;
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

function isIpad()
{
	const ua = window.navigator.userAgent;
	if (ua.indexOf('iPad') > -1)
	{
		return true;
	}

	if (ua.indexOf('Macintosh') > -1)
	{
		try
		{
			document.createEvent("TouchEvent");
			return true;
		} catch (e) { }
	}

	return false;
}

function isAndroid()
{
	return /(android)/i.test(navigator.userAgent);
}

function getLocation()
{
	return new Promise(res =>
	{
		const pos = {
			latitude: null,
			longitude: null,
			errorCode: 0
		};
		if (!navigator.geolocation)
		{
			res(pos);
		} else
		{
			navigator.geolocation.getCurrentPosition(
				position =>
				{
					pos.latitude = position.coords.latitude;
					pos.longitude = position.coords.longitude;
					res(pos);
				},
				err =>
				{
					pos.errorCode = err.code;
					res(pos);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				});
		}
	});
}

createNamespace("TF").getLocation = getLocation;
createNamespace("TF").isMobileDevice = isMobileDevice();
createNamespace("TF").isSafari = isSafari();
createNamespace("TF").isIOS = isIOS();
createNamespace("TF").isPhoneDevice = isPhoneDevice();
createNamespace("TF").isPortrait = isPortrait();
createNamespace("TF").isLandscape = isLandscape();
createNamespace("TF").isAndroid = isAndroid();
createNamespace("TF").getIOSVersion = getIOSVersion();

createNamespace("TF").getSingularOrPluralTitle = function(title, count)
{
	if (title.toLowerCase() === "water")
	{
		return title;
	}
	if (title[title.length - 1] === "s")
	{
		title = Array.prototype.slice.call(title, 0, title.length - 1).join("");
	}
	if (count !== 1)
	{
		title = title + "s";
	}
	return title;
};

TF.isIE = (function()
{
	var ua = window.navigator.userAgent;
	var matches = /Edg\/(\d{2})/g.exec(ua);
	var isEdge = false;
	if (matches && matches.length == 2)
	{
		isEdge = parseInt(matches[1]) < 79;
	}
	return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1 || isEdge;
})();

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
	let index = array.indexOf(item);
	while ((index) > -1)
	{
		array.splice(index, 1);
		index = array.indexOf(item);
	}
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

Array.sortBy = function(arr, fieldName, desc)
{
	var factor = desc ? -1 : 1;
	var sort = function(a, b)
	{
		var aField = a[fieldName], bField = b[fieldName];
		if (aField === null && bField === null)
		{
			return 0;
		}

		if (aField === null)
		{
			return -1;
		}

		if (bField === null)
		{
			return 1;
		}

		if (aField === bField)
		{
			return 0;
		}

		if (aField.toUpperCase)
		{
			var aFieldUpper = aField.toUpperCase(), bFieldUpper = bField.toUpperCase();
			if (aFieldUpper === bFieldUpper)
			{
				return aField > bField ? 1 : -1;
			}
			return aFieldUpper > bFieldUpper ? 1 : -1;
		}

		return aField > bField ? 1 : -1;
	};

	return arr.sort(function(a, b)
	{
		return sort(a, b) * factor;
	});
};

Array.equals = function(arr1, arr2)
{
	arr1 = arr1.sort();
	arr2 = arr2.sort();
	// if the other array is a falsy value, return
	if (!arr2)
	{
		return false;
	}

	// compare lengths - can save a lot of time
	if (arr1.length !== arr2.length)
	{
		return false;
	}

	for (var i = 0, l = arr1.length; i < l; i++)
	{
		// Check if we have nested arrays
		if (arr1[i] instanceof Array && arr2[i] instanceof Array)
		{
			// recurse into the nested arrays
			if (!arr1[i].equals(arr2[i]))
			{
				return false;
			}
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
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes)
{
	Object.defineProperty(Array.prototype, 'includes', {
		value: function(searchElement, fromIndex)
		{

			// 1. Let O be ? ToObject(this value).
			if (this == null)
			{
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If len is 0, return false.
			if (len === 0)
			{
				return false;
			}

			// 4. Let n be ? ToInteger(fromIndex).
			//    (If fromIndex is undefined, this step produces the value 0.)
			var n = fromIndex | 0;

			// 5. If n ≥ 0, then
			//  a. Let k be n.
			// 6. Else n < 0,
			//  a. Let k be len + n.
			//  b. If k < 0, let k be 0.
			var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

			// 7. Repeat, while k < len
			while (k < len)
			{
				// a. Let elementK be the result of ? Get(O, ! ToString(k)).
				// b. If SameValueZero(searchElement, elementK) is true, return true.
				// c. Increase k by 1.
				// NOTE: === provides the correct "SameValueZero" comparison needed here.
				if (o[k] === searchElement)
				{
					return true;
				}
				k++;
			}

			// 8. Return false
			return false;
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

String.prototype.endsWith = function(suffix)
{
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.convertToBoolean = function(value)
{
	if (value === 'True')
	{
		return true;
	}
	else if (value === 'False')
	{
		return false;
	}
	else
	{
		return value;
	}
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

//swipe event for mobile
function detectswipe(ele, func)
{
	swipe_det = new Object();
	swipe_det.sX = 0; swipe_det.sY = 0; swipe_det.eX = 0; swipe_det.eY = 0;
	var min_x = 30,  //min x swipe for horizontal swipe
		max_x = 30,  //max x difference for vertical swipe
		min_y = 50,  //min y swipe for vertical swipe
		max_y = 60,  //max y difference for horizontal swipe
		direc = "",
		start,
		move,
		end;

	start = function(e)
	{
		var t = e.originalEvent.touches[0];
		swipe_det.sX = t.screenX;
		swipe_det.sY = t.screenY;
	};
	move = function(e)
	{
		e.preventDefault();
		var t = e.originalEvent.touches[0];
		swipe_det.eX = t.screenX;
		swipe_det.eY = t.screenY;
	};
	end = function(e)
	{
		//horizontal detection
		if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX))
			&& ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y) && (swipe_det.eX > 0))))
		{
			if (swipe_det.eX > swipe_det.sX)
			{
				direc = "r";
			}
			else
			{
				direc = "l";
			}
		}
		//vertical detection
		else if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY))
			&& ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x) && (swipe_det.eY > 0))))
		{
			if (swipe_det.eY > swipe_det.sY)
			{
				direc = "d";
			}
			else
			{
				direc = "u";
			}
		}

		if (direc != "")
		{
			if (typeof func == 'function')
			{
				func(ele, direc);
			}
		}
		direc = "";
		swipe_det.sX = 0;
		swipe_det.sY = 0;
		swipe_det.eX = 0;
		swipe_det.eY = 0;
	};
	ele.off(".swipe");
	ele.on('touchstart.swipe', start);
	ele.on('touchmove.swipe', move);
	ele.on('touchend.swipe', end);
}

function toISOStringWithoutTimeZone(m)
{
	return m.format('YYYY-MM-DDTHH:mm:ss.SSS');
}

function convertToMoment(value)
{
	if ((/^\d*:\d*:\d*$/g).test(value))
	{
		return moment("1900-01-01 " + value);
	}
	return moment(value);
}

function utcToClientTimeZone(utcValue)
{
	if (!utcValue)
	{
		return moment('invalid');
	}

	if (typeof (utcValue) !== "string")
	{
		utcValue = toISOStringWithoutTimeZone(moment(utcValue));
	}

	var m = moment.utc(utcValue);
	if (tf.clientTimeZone)
	{
		if (tf.clientTimeZone.IanaId)
		{
			m.tz(tf.clientTimeZone.IanaId);
		}
		else
		{
			m.add(tf.clientTimeZone.HoursDiff, "hours");
		}
	}

	return m;
}

function clientTimeZoneToUtc(clientValue)
{
	if (typeof (clientValue) !== "string")
	{
		clientValue = toISOStringWithoutTimeZone(moment(clientValue));
	}

	let dt;
	if (tf.clientTimeZone)
	{
		if (tf.clientTimeZone.IanaId)
		{
			dt = moment.tz(clientValue, tf.clientTimeZone.IanaId);
			dt.utc();
		}
		else
		{
			dt = moment(clientValue);
			dt.add(tf.clientTimeZone.HoursDiff * -1, "hours");
		}
	}
	else
	{
		dt = moment(clientValue);
	}

	return dt;
}

function getTitleByType(type)
{
	var pageTitle = "", pageType = type.toLowerCase();
	switch (pageType)
	{
		case "contacts":
			pageTitle = tf.applicationTerm.getApplicationTermPluralByName("Contact");
			break;
		case "scheduler":
		case "fieldtrips":
			pageTitle = tf.applicationTerm.getApplicationTermPluralByName("Field Trip");
			break;
		case "fieldtrip":
			pageTitle = tf.applicationTerm.getApplicationTermSingularByName("Field Trip");
			break;
		case "myrequests":
			pageTitle = "My Submitted Requests";
			break;
		case "reports":
			pageTitle = "Reports";
			break;
		case "approvals":
			pageTitle = "My Pending Approvals";
			break;
		case "settings":
			pageTitle = "SETTINGS";
			break;
		case "vehicles":
			pageTitle = tf.applicationTerm.getApplicationTermPluralByName("Vehicle");
			break;
		default:
			break;
	}
	return pageTitle;
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

	return timeA.isAfter(timeB) ? 1 : -1;
}

function compareTimeColumn2(a, b)
{
	var timeA = moment(moment(a).format("1900/01/01 HH:mm:ss"));
	var timeB = moment(moment(b).format("1900/01/01 HH:mm:ss"));

	return timeA.isAfter(timeB) ? 1 : -1;
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

function booleanToCheckboxFormatter(value)
{
	var checked = "";
	if (value && value !== "false")
	{
		checked = "checked";
	}
	return checked;
}
(function()
{
	//disable default right click menu
	document.oncontextmenu = function(event)
	{
		let srcElement = event.target || event.srcElement;
		if (srcElement
			&& (
				$(srcElement).attr('enableRightClickMenu') === 'true' ||
				(($(srcElement).is(":text") || srcElement.nodeName.toLowerCase() == "textarea") && !srcElement.hasAttribute('readonly') && !srcElement.hasAttribute('disabled'))
			))
		{
			return true;
		}
		
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
		// This is intentional
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

createNamespace("TF").isLightness = function(color)
{
	var arcgisColor = new tf.map.ArcGIS.Color(color);
	var brightness = (arcgisColor.r * 299 + arcgisColor.g * 587 + arcgisColor.b * 114) / 1000;
	return brightness >= 123;
};

(function()
{
	createNamespace("TF").menuHelper = menuHelper;

	function menuHelper()
	{
		// This is intentional
	}

	menuHelper.hiddenMenu = function()
	{
		tf.contextMenuManager.dispose();
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
		{
			return false;
		}

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
	var method = object[methodName] || function()
	{
		// This is intentional
	};
	return (object[methodName] = function()
	{
		var ret = fn.apply(scope || this, arguments);
		method.apply(this, arguments);
		return ret;
	});
};

Function.prototype.interceptAfter = function(object, methodName, fn, scope)
{
	var method = object[methodName] || function()
	{
		// This is intentional
	};
	return (object[methodName] = function()
	{
		method.apply(this, arguments);
		return fn.apply(scope || this, arguments);
	});
};

(function($)
{
	$.fn.bootstrapValidator.validators.phoneinplus = {
		validate: function(validator, $field, options)
		{
			var value = $field.val();

			return value === "" ? true : tf.dataFormatHelper.isValidPhoneNumber(value);
		}
	}
}(window.jQuery));

tf.isTripfinder = true;

createNamespace("TF").fixGeometryErrorInKendo = function(data)
{
	if (toString.call(data) == "[object Array]")
	{
		data.forEach(function(c)
		{
			TF.fixGeometryErrorInKendo(c);
		});
	}
	for (var key in data)
	{
		var type = toString.call(data[key]);
		if (key == "geometry" || (data[key] && data[key].spatialReference))
		{
			data[key].getTime = true;
		}
		else if (type == "[object Object]" || type == "[object Array]")
		{
			TF.fixGeometryErrorInKendo(data[key]);
		}
	}
};

moment().constructor.prototype.currentTimeZoneTime = function()
{
	var now = this.utcOffset(tf.timezonetotalminutes);
	return moment([now.year(), now.month(), now.date(), now.hour(), now.minutes(), now.seconds(), now.millisecond()]);
};

moment().constructor.prototype.currentTimeZoneTimeFormat = function(format)
{
	return this.utcOffset(tf.timezonetotalminutes).format(format || "");
};

if (!String.prototype.format)
{
	String.prototype.format = function()
	{
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number)
		{
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}

Math.tfRound = function(value, precision = 0)
{
	if (precision < 0 || !Number.isInteger(precision))
	{
		throw new Error("Invalid parameter!");
	}

	return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

//#region Map Canvas Associated

const defaultMapSettings = {
	extent: {
		spatialReference: {
			wkid: 102100
		},
		xmin: -8232222.558154176,
		ymin: 5280026.892399614,
		xmax: -8219056.253699447,
		ymax: 5289017.815833504
	}
};

if (typeof MapSettings == "undefined")
{
	MapSettings = {};
}

createNamespace("TF").initSystemMapSettings = function()
{
	return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo?InfoID=MapSettings"), null, { overlay: false })
		.then(function(response)
		{
			if (response.Items && response.Items.length)
			{
				const json = response.Items[0].InfoValue;
				try
				{
					MapSettings = JSON.parse(json);
				}
				catch (ex)
				{
				}
			}
		});
};
createNamespace("TF").getMapSettings = function()
{
	const userMapSettings = tf.userPreferenceManager.get("rfweb.mapSettings") || {};
	return $.extend({}, defaultMapSettings, MapSettings, userMapSettings);
};

createNamespace("TF").createDefaultMapExtent = function()
{
	const settings = TF.getMapSettings() || {},
		extentSettings = settings.extent;
	if (extentSettings)
	{
		return new tf.map.ArcGIS.Extent(extentSettings);
	}

	return null;
};

/*reversegeocode by use choose param(addresspoint or address)*/
createNamespace("TF").locationToAddress = function(geometry, param, geocodeServiceUrl)
{
	var addressPointGeocoder, streetGeocoder;
	return tf.startup.loadArcgisUrls().then(function()
	{
		addressPointGeocoder = new tf.map.ArcGIS.Locator(geocodeServiceUrl || arcgisUrls.AddressPointGeocodeService);
		streetGeocoder = new tf.map.ArcGIS.Locator(geocodeServiceUrl || arcgisUrls.StreetGeocodeServiceFile);
		if (param && param.GeocodeType === TF.Helper.TripHelper.GeocodeSource.addressPoint.value)
		{
			return addressPointGeocoder.locationToAddress({ location: geometry }).then(function(apResult)
			{
				apResult.attributes.Street = normalizeStreet(apResult.attributes.Street ? apResult.attributes.Street : apResult.attributes.Address);
				return apResult.attributes;

			}, function()
			{
				return false;
			});
		}
		else if (param && param.GeocodeType === TF.Helper.TripHelper.GeocodeSource.mapStreet.value)
		{
			return streetGeocoder.locationToAddress({ location: geometry }).then(function(streetResult)
			{
				streetResult.attributes.Street = normalizeStreet(streetResult.attributes.Street ? streetResult.attributes.Street : streetResult.attributes.Address);
				return streetResult.attributes;
			}, function()
			{
				return false;
			});
		} else
		{
			return addressPointGeocoder.locationToAddress({ location: geometry }).then(function(apResult)
			{
				apResult.attributes.Street = normalizeStreet(apResult.attributes.Street ? apResult.attributes.Street : apResult.attributes.Address);
				return apResult.attributes;

			}, function()
			{
				return streetGeocoder.locationToAddress({ location: geometry }).then(function(streetResult)
				{
					streetResult.attributes.Street = normalizeStreet(streetResult.attributes.Street ? streetResult.attributes.Street : streetResult.attributes.Address);
					return streetResult.attributes;
				}, function()
				{
					return false;
				});
			});
		}

	});

	function normalizeStreet(street)
	{
		var result = /(\d*\.?\d*)(.*)/.exec(street);
		if (result.length > 2 && result[1])
		{
			return parseInt(result[1]) + result[2];
		}
		return street;
	}
};

createNamespace("TF").queryTravelSCenarios = function(scenarioId, usingFileService)
{
	let curbApproachsPromise = null,
		travelRegionsPromise = null;
	if (usingFileService)
	{
		curbApproachsPromise = cacheQueryFeature(arcgisUrls.MapEditingOneServiceFile + "/24", scenarioId);
		travelRegionsPromise = cacheQueryFeature(arcgisUrls.MapEditingOneServiceFile + "/25", scenarioId);
	}
	else
	{
		curbApproachsPromise = cacheQueryFeature(arcgisUrls.MapEditingOneService + "/24", scenarioId);
		travelRegionsPromise = cacheQueryFeature(arcgisUrls.MapEditingOneService + "/25", scenarioId);
	}
	return Promise.all([curbApproachsPromise, travelRegionsPromise]).then(function(data)
	{
		return [data[0].features, data[1].features];
	}).catch(function()
	{
		tf.loadingIndicator.hideWhenError();
	});
};

function cacheQueryFeature(url, scenarioId)
{
	const cacheKey = url + "-" + (scenarioId ? scenarioId.toString() : ""), currentTimeSpan = moment();
	if (window[cacheKey] && window[cacheKey + "TimeSpan"] && currentTimeSpan.diff(window[cacheKey + "TimeSpan"], 'seconds') <= 2)
	{
		return Promise.resolve(window[cacheKey]);
	}
	if (window["Promise" + cacheKey])
	{
		return window["Promise" + cacheKey];
	}
	window["Promise" + cacheKey] = queryFeature(url, scenarioId);
	return window["Promise" + cacheKey].then(result =>
	{
		window[cacheKey] = result;
		window[cacheKey + "TimeSpan"] = moment();
		window["Promise" + cacheKey] = null;
		return result;
	});
}

function queryFeature(url, scenarioId)
{
	let query = new tf.map.ArcGIS.Query();
	const queryTask = new tf.map.ArcGIS.QueryTask({ url: url });
	query.outFields = ["*"];
	query.where = scenarioId ? ("ScenarioId=" + scenarioId) : "1=1";
	query.returnGeometry = true;
	return queryTask.execute(query);
}

createNamespace("TF").uturnDic = {
	"allow-backtrack": "esriNFSBAllowBacktrack",
	"at-dead-ends-only": "esriNFSBAtDeadEndsOnly",
	"at-dead-ends-and-intersections": "esriNFSBAtDeadEndsAndIntersections",
	"no-backtrack": "esriNFSBNoBacktrack"
};

createNamespace("TF").convertToBoolean = function(data)
{
	if (typeof (data) == "string")
	{
		return data.toLowerCase() == "true";
	}
	if (data == null)
	{
		return false;
	}
	return !!data;
};

createNamespace("TF").cloneGeometry = function(geometry)
{
	if (!geometry)
	{
		return null;
	}
	return geometry.clone();
};

createNamespace("TF").createId = function(randomNumber)
{
	var number = randomNumber ? randomNumber : 1000;
	return parseFloat((new Date()).getTime().toString().substr(8, 13) + "" + Math.floor(Math.random() * number));
};

createNamespace("TF").xyToGeometry = function(x, y)
{
	var p = new tf.map.ArcGIS.Point(x, y, tf.map.ArcGIS.SpatialReference.WGS84);
	return tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(p);
};

// FOR DEMO ONLY
createNamespace("TF").getOnlineUrl = function(url){
	if(typeof window.mapServiceType == 'undefined' || window.mapServiceType == 0 || window.mapServiceType == 1)
	{
		if(url.endsWith("/FeatureServer/25") || url.endsWith("/MapServer/25"))
		{
			url = "https://services8.arcgis.com/kULjRYHBqUKIzQCS/arcgis/rest/services/travelscenario03/FeatureServer/0";
		}
	}
	else if(window.mapServiceType == 2)
	{
		if(url.endsWith("/FeatureServer/0"))
		{
			url = arcgisUrls.MapEditingOneService + "/25"
		}
	}

	return url;
}
//#endregion

function IsEmptyString(str)
{
	return (str === null ||
		str === undefined ||
		str === "");
}