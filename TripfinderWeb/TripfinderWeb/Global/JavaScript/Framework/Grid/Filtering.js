(function()
{
	TF.FilterSet = function(logicalOperator, filterItems, filterSets)
	{
		this.LogicalOperator = logicalOperator;
		this.FilterItems = filterItems ? filterItems : [];
		this.FilterSets = filterSets ? filterSets : [];
	}

	TF.FilterItem = function(fieldName, operator, value, typeHint)
	{
		this.FieldName = fieldName;
		this.Operator = operator;
		this.Value = value;
		if (typeHint != null && typeHint != undefined)
		{
			this.TypeHint = typeHint;
		}
	}

	TF.GridFilterTimer = function(grid)
	{
		this._defaultTime = 3000;
		this._grid = grid;
	};

	TF.GridFilterTimer.prototype = {
		_defaultTime: null,
		_grid: null,
		_timer: null,

		stop: function()
		{
			if (this._timer != null)
			{
				clearTimeout(this._timer);
				this._timer = null;
			}
		},

		trigger: function()
		{
			this.stop();
			var $executeProxy = $.proxy(this._executeCall, this);
			this._timer = setTimeout($executeProxy, this._defaultTime);
		},

		_executeCall: function()
		{
			this._grid.refresh();
		}
	};

})();