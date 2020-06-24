(function()
{
	//the graphic lib is created for graphic calculation, position/size query and graphic adjustments for DOMs
	createNamespace("TF.Graphic").RectUtility = RectUtility;

	function RectUtility()
	{
	}

	/**
	 * function to get rect data of a dom
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {array} rect array example: [{ left: 0, top: 0, width: 0, height:0 }, ...]
	 */
	RectUtility.getElementRects = function(query)
	{
		var rects = [];

		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		$element.each(function()
		{
			var $self = $(this);

			var rect = { left: 0, top: 0, width: 0, height: 0 };
			var elementOffset = $self.offset();
			rect.height = $self.outerHeight();
			rect.width = $self.outerWidth();

			rect.top = elementOffset.top;
			rect.left = elementOffset.left;

			rects.push(rect);
		});

		return rects;
	};

	/**
	 * function to get the max left value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} max left of doms
	 */
	RectUtility.getMaxLeft = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.max.apply(null, $.map($element, function(e, i)
		{
			return $(e).offset().left;
		}));
	};

	/**
	 * function to get the min left value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} min left of doms
	 */
	RectUtility.getMinLeft = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.min.apply(null, $.map($element, function(e, i)
		{
			return $(e).offset().left;
		}));
	};

	/**
	 * function to get the max top value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} max top of doms
	 */
	RectUtility.getMaxTop = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.max.apply(null, $.map($element, function(e, i)
		{
			return $(e).offset().top;
		}));
	};

	/**
	 * function to get the min top value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} min top of doms
	 */
	RectUtility.getMinTop = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.min.apply(null, $.map($element, function(e, i)
		{
			return $(e).offset().top;
		}));
	};

	/**
	 * function to get the max width value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} max width of doms
	 */
	RectUtility.getMaxWidth = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.max.apply(null, $.map($element, function(e, i)
		{
			return $(e).outerWidth();
		}));
	};

	/**
	 * function to get the min width value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} min width of doms
	 */
	RectUtility.getMinWidth = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.min.apply(null, $.map($element, function(e, i)
		{
			return $(e).outerWidth();
		}));
	};

	/**
 * function to get the max height value of a collection of dom by querying
 * 
 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
 * @returns {int} max height of doms
 */
	RectUtility.getMaxHeight = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.max.apply(null, $.map($element, function(e, i)
		{
			return $(e).outerHeight();
		}));
	};

	/**
	 * function to get the min height value of a collection of dom by querying
	 * 
	 * @param {string/jQuery} query jquery string or jquery object for the element to get the dom
	 * @returns {int} min height of doms
	 */
	RectUtility.getMinHeight = function(query)
	{
		var $element = null;
		if (typeof (query) === 'string')
		{
			$element = $(query);
		}
		else
		{
			$element = query;
		}

		return Math.min.apply(null, $.map($element, function(e, i)
		{
			return $(e).outerHeight();
		}));
	};
})()